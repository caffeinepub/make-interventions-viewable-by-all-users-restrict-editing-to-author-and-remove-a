import Auth "authorization/access-control";
import UserApproval "user-approval/approval";
import Runtime "mo:core/Runtime";
import List "mo:core/List";
import Order "mo:core/Order";
import Map "mo:core/Map";
import Array "mo:core/Array";
import Nat "mo:core/Nat";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Principal "mo:core/Principal";
import Storage "blob-storage/Storage";
import MixinStorage "blob-storage/Mixin";
import MixinAuthorization "authorization/MixinAuthorization";

actor {
  // Types
  type Folder = {
    name : Text;
    files : Map.Map<Text, Storage.ExternalBlob>;
    subfolders : Map.Map<Text, Folder>;
  };

  type Address = {
    street : Text;
    city : Text;
    state : Text;
    zip : Text;
  };

  type ContactInfo = {
    name : Text;
    address : Address;
    phone : Text;
    email : Text;
  };

  public type Client = {
    info : ContactInfo;
    isBlacklisted : Bool;
    blacklistComments : Text;
    blacklistMedia : [Storage.ExternalBlob];
    updatedAt : Time.Time;
  };

  public type Intervention = {
    id : Text;
    clientId : Text;
    employee : Principal;
    comments : Text;
    media : [Storage.ExternalBlob];
    date : { day : Nat; month : Nat; year : Nat };
    interventionTimestamp : Time.Time;
    updatedAt : Time.Time;
    canEdit : Bool;
    canDelete : Bool;
  };

  public type UserProfile = {
    name : Text;
  };

  public type MediaItem = {
    id : Text;
    owner : Principal;
    file : Storage.ExternalBlob;
    createdAt : Time.Time;
  };

  public type ScheduledIntervention = {
    id : Text;
    clientId : Text;
    clientName : Text;
    assignedEmployee : Principal;
    reason : Text;
    startTime : Text;
    endTime : Text;
    description : Text;
    media : [Storage.ExternalBlob];
    employeeSignature : ?Text;
    clientSignature : ?Text;
    date : { day : Nat; month : Nat; year : Nat };
    weekNumber : Nat;
    weekYear : Nat;
    createdBy : Principal;
    createdAt : Time.Time;
    updatedAt : Time.Time;
  };

  public type WorkHours = {
    id : Text;
    employee : Principal;
    date : { day : Nat; month : Nat; year : Nat };
    morningStart : Text;
    morningEnd : Text;
    afternoonStart : Text;
    afternoonEnd : Text;
    updatedAt : Time.Time;
  };

  // State
  let clients = Map.empty<Text, Client>();
  let technicalFolder = Map.empty<Text, Folder>();
  let interventions = Map.empty<Text, List.List<Intervention>>();
  let userProfiles = Map.empty<Principal, UserProfile>();
  let mediaStorage = Map.empty<Text, MediaItem>();
  let scheduledInterventions = Map.empty<Text, ScheduledIntervention>();
  let workHoursStore = Map.empty<Text, WorkHours>();
  let accessControlState = Auth.initState();
  let approvalState = UserApproval.initState(accessControlState);

  // Stable admin principal - persists across upgrades and redeployments
  stable var adminPrincipal : ?Principal = null;
  stable var adminAssigned : Bool = false;

  include MixinStorage();
  include MixinAuthorization(accessControlState);

  module Client {
    public func compare(client1 : Client, client2 : Client) : Order.Order {
      client1.info.name.compare(client2.info.name);
    };
  };

  func isAdmin(caller : Principal) : Bool {
    let isRoleAdmin = Auth.isAdmin(accessControlState, caller);
    let isStableAdmin = switch (adminPrincipal) {
      case (?p) { p == caller };
      case (null) { false };
    };
    isStableAdmin or isRoleAdmin;
  };

  // Restores admin role in accessControlState from stable storage if needed,
  // then returns whether the caller is admin. Self-healing after redeployment.
  public shared ({ caller }) func syncAdminRole() : async Bool {
    let stableAdminMatch = switch (adminPrincipal) {
      case (?p) { p == caller };
      case (null) { false };
    };
    if (stableAdminMatch and not Auth.isAdmin(accessControlState, caller)) {
      // Restore role from stable storage
      accessControlState.userRoles.add(caller, #admin);
      UserApproval.setApproval(approvalState, caller, #approved);
    };
    isAdmin(caller);
  };

  func _hasPermission(caller : Principal, role : Auth.UserRole) : Bool {
    Auth.hasPermission(accessControlState, caller, role);
  };

  public query ({ caller }) func hasAdminRegistered() : async Bool {
    adminAssigned;
  };

  public shared ({ caller }) func claimAdminIfNoneExists() : async () {
    if (adminAssigned) {
      Runtime.trap("Un administrateur est déjà enregistré");
    };
    accessControlState.userRoles.add(caller, #admin);
    UserApproval.setApproval(approvalState, caller, #approved);
    adminAssigned := true;
    adminPrincipal := ?caller;
  };

  public query ({ caller }) func isCallerApproved() : async Bool {
    let adminCheck = switch (adminPrincipal) {
      case (?p) { p == caller };
      case (null) { false };
    };
    adminCheck or Auth.isAdmin(accessControlState, caller) or UserApproval.isApproved(approvalState, caller);
  };

  public shared ({ caller }) func requestApproval() : async () {
    if (isAdmin(caller)) {
      Runtime.trap("Administrateur est déjà approuvé");
    };
    UserApproval.requestApproval(approvalState, caller);
  };

  public shared ({ caller }) func setApproval(user : Principal, status : UserApproval.ApprovalStatus) : async () {
    if (not isAdmin(caller)) {
      Runtime.trap("Non autorisé : seuls les administrateurs peuvent approuver/désapprouver");
    };
    UserApproval.setApproval(approvalState, user, status);
    if (status == #approved) {
      Auth.assignRole(accessControlState, caller, user, #user);
    };
  };

  public query ({ caller }) func listApprovals() : async [UserApproval.UserApprovalInfo] {
    if (not isAdmin(caller)) {
      Runtime.trap("Non autorisé : seuls les administrateurs peuvent voir les demandes d'approbation");
    };
    UserApproval.listApprovals(approvalState);
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    checkAccess(caller);
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not isAdmin(caller)) {
      Runtime.trap("Non autorisé : vous ne pouvez voir que votre propre profil");
    };
    userProfiles.get(user);
  };

  public query ({ caller }) func getUserProfilesByPrincipals(principals : [Principal]) : async [(Principal, UserProfile)] {
    checkAccess(caller);
    userProfiles.filter(
      func(principal, _profile) { principals.find(func(p) { p == principal }) != null }
    ).toArray();
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    // No access check — profile can be saved before approval (needed for first-time admin claim)
    userProfiles.add(caller, profile);
  };

  // Client Methods
  public query ({ caller }) func getClients() : async [Client] {
    checkAccess(caller);
    clients.values().toArray().sort();
  };

  public query ({ caller }) func getClientsWithIds() : async [(Text, Client)] {
    checkAccess(caller);
    clients.toArray();
  };

  public query ({ caller }) func getClient(clientId : Text) : async Client {
    checkAccess(caller);
    switch (clients.get(clientId)) {
      case (null) { Runtime.trap("Client non trouvé") };
      case (?client) { client };
    };
  };

  public shared ({ caller }) func createOrUpdateClient(
    id : Text,
    name : Text,
    address : Address,
    phone : Text,
    email : Text,
  ) : async () {
    checkAccess(caller);
    switch (clients.get(id)) {
      case (null) {
        let newClient : Client = {
          info = { name; address; phone; email };
          isBlacklisted = false;
          blacklistComments = "";
          blacklistMedia = [];
          updatedAt = Time.now();
        };
        clients.add(id, newClient);
      };
      case (?existingClient) {
        if (existingClient.isBlacklisted) {
          Runtime.trap("Les clients sur la liste noire ne peuvent pas être mis à jour");
        };
        let updatedClient : Client = {
          info = { name; address; phone; email };
          isBlacklisted = existingClient.isBlacklisted;
          blacklistComments = existingClient.blacklistComments;
          blacklistMedia = existingClient.blacklistMedia;
          updatedAt = Time.now();
        };
        clients.add(id, updatedClient);
      };
    };
  };

  public query ({ caller }) func searchClients(searchString : Text) : async [Client] {
    checkAccess(caller);
    let matches = clients.values().filter(
      func(client) {
        client.info.name.toLower().contains(#text(searchString.toLower()));
      }
    );
    matches.toArray();
  };

  public shared ({ caller }) func markAsBlacklisted(
    clientId : Text,
    comments : Text,
    media : [Storage.ExternalBlob],
  ) : async () {
    checkAccess(caller);
    switch (clients.get(clientId)) {
      case (null) { Runtime.trap("Client non trouvé") };
      case (?client) {
        let updatedClient : Client = {
          info = client.info;
          isBlacklisted = true;
          blacklistComments = comments;
          blacklistMedia = media;
          updatedAt = Time.now();
        };
        clients.add(clientId, updatedClient);
      };
    };
  };

  public shared ({ caller }) func unmarkAsBlacklisted(clientId : Text) : async () {
    checkAccess(caller);
    switch (clients.get(clientId)) {
      case (null) { Runtime.trap("Client non trouvé") };
      case (?client) {
        let updatedClient : Client = {
          info = client.info;
          isBlacklisted = false;
          blacklistComments = "";
          blacklistMedia = [];
          updatedAt = Time.now();
        };
        clients.add(clientId, updatedClient);
      };
    };
  };

  // Intervention Management
  public shared ({ caller }) func addIntervention(
    clientId : Text,
    comments : Text,
    media : [Storage.ExternalBlob],
    day : Nat,
    month : Nat,
    year : Nat,
  ) : async () {
    checkAccess(caller);
    switch (clients.get(clientId)) {
      case (null) { Runtime.trap("Client non trouvé") };
      case (?_) {
        let intervention : Intervention = {
          id = clientId.concat(Time.now().toText());
          clientId;
          employee = caller;
          interventionTimestamp = Time.now();
          comments;
          media;
          date = { day; month; year };
          updatedAt = Time.now();
          canEdit = true;
          canDelete = true;
        };
        let existingInterventions = switch (interventions.get(clientId)) {
          case (null) { List.empty<Intervention>() };
          case (?list) { list };
        };
        existingInterventions.add(intervention);
        interventions.add(clientId, existingInterventions);
      };
    };
  };

  public query ({ caller }) func getClientInterventions(clientId : Text) : async [Intervention] {
    checkAccess(caller);
    switch (interventions.get(clientId)) {
      case (null) { [] };
      case (?list) {
        list.toArray().map(
          func(intervention) {
            if (intervention.employee == caller or isAdmin(caller)) {
              { intervention with canEdit = true; canDelete = true };
            } else {
              { intervention with canEdit = false; canDelete = false };
            };
          }
        );
      };
    };
  };

  public shared ({ caller }) func updateIntervention(
    interventionId : Text,
    clientId : Text,
    comments : Text,
    media : [Storage.ExternalBlob],
    day : Nat,
    month : Nat,
    year : Nat,
  ) : async () {
    checkAccess(caller);
    switch (interventions.get(clientId)) {
      case (null) { Runtime.trap("Client non trouvé") };
      case (?list) {
        let interventionArray = list.toArray();
        var found = false;
        let updatedArray = interventionArray.map(
          func(intervention) {
            if (intervention.id == interventionId) {
              if (intervention.employee != caller and not isAdmin(caller)) {
                Runtime.trap("Non autorisé : vous ne pouvez mettre à jour que vos propres interventions");
              };
              found := true;
              {
                id = intervention.id;
                clientId = intervention.clientId;
                employee = intervention.employee;
                interventionTimestamp = intervention.interventionTimestamp;
                comments;
                media;
                date = { day; month; year };
                updatedAt = Time.now();
                canEdit = true;
                canDelete = true;
              };
            } else {
              intervention;
            };
          }
        );
        if (not found) {
          Runtime.trap("Intervention non trouvée");
        };
        let updatedList = List.fromArray<Intervention>(updatedArray);
        interventions.add(clientId, updatedList);
      };
    };
  };

  public shared ({ caller }) func deleteIntervention(interventionId : Text, clientId : Text) : async () {
    checkAccess(caller);
    switch (interventions.get(clientId)) {
      case (null) { Runtime.trap("Client non trouvé") };
      case (?list) {
        let interventionArray = list.toArray();
        var found = false;
        let filteredArray = interventionArray.filter(
          func(intervention) {
            if (intervention.id == interventionId) {
              if (intervention.employee != caller and not isAdmin(caller)) {
                Runtime.trap("Non autorisé : vous ne pouvez supprimer que vos propres interventions");
              };
              found := true;
              false;
            } else {
              true;
            };
          }
        );
        if (not found) {
          Runtime.trap("Intervention non trouvée");
        };
        let updatedList = List.fromArray<Intervention>(filteredArray);
        interventions.add(clientId, updatedList);
      };
    };
  };

  public query ({ caller }) func getInterventionsByDate(day : Nat, month : Nat, year : Nat) : async [Intervention] {
    checkAccess(caller);
    let matchingInterventions = List.empty<Intervention>();
    interventions.forEach(
      func(_clientId, interventionsList) {
        for (intervention : Intervention in interventionsList.values()) {
          if (intervention.date.day == day and intervention.date.month == month and intervention.date.year == year) {
            matchingInterventions.add(intervention);
          };
        };
      }
    );
    matchingInterventions.toArray();
  };

  // Media Management
  public query ({ caller }) func getMediaItem(mediaId : Text) : async ?MediaItem {
    checkAccess(caller);
    mediaStorage.get(mediaId);
  };

  public query ({ caller }) func listAllMediaItems() : async [MediaItem] {
    checkAccess(caller);
    mediaStorage.values().toArray();
  };

  public shared ({ caller }) func uploadMediaItem(
    { file : Storage.ExternalBlob },
  ) : async Text {
    checkAccess(caller);
    let mediaId = caller.toText().concat(Time.now().toText());
    let mediaItem : MediaItem = {
      id = mediaId;
      owner = caller;
      file;
      createdAt = Time.now();
    };
    mediaStorage.add(mediaId, mediaItem);
    mediaId;
  };

  public shared ({ caller }) func deleteMediaItem(mediaId : Text) : async () {
    checkAccess(caller);
    switch (mediaStorage.get(mediaId)) {
      case (null) { Runtime.trap("Élément média introuvable") };
      case (?mediaItem) {
        if (mediaItem.owner != caller and not isAdmin(caller)) {
          Runtime.trap("Non autorisé : vous ne pouvez supprimer que vos propres médias");
        };
        mediaStorage.remove(mediaId);
      };
    };
  };

  // Technical Folder Management
  public query ({ caller }) func listTechnicalFiles() : async [(Text, Storage.ExternalBlob)] {
    checkAccess(caller);
    let result = List.empty<(Text, Storage.ExternalBlob)>();
    func traverseFolderTree(folder : Folder, path : Text) {
      folder.files.toArray().forEach(
        func(file) { result.add((path.concat(file.0), file.1)); }
      );
      folder.subfolders.toArray().forEach(
        func(subfolder) { traverseFolderTree(subfolder.1, path.concat(subfolder.0).concat("/")); }
      );
    };
    technicalFolder.forEach(
      func(folderName, folder) { traverseFolderTree(folder, folderName.concat("/")); }
    );
    result.toArray();
  };

  public query ({ caller }) func downloadTechnicalFileWithPath(path : Text) : async ?Storage.ExternalBlob {
    checkAccess(caller);
    let parts = path.split(#char('/')).toArray();
    if (parts.size() == 0) { return null; };
    let topLevelFolderName = parts[0];
    let remainingPath = parts.sliceToArray(1, parts.size() : Nat);
    switch (technicalFolder.get(topLevelFolderName)) {
      case (null) { null };
      case (?folder) {
        switch (findFileInPath(folder, remainingPath)) {
          case (null) { null };
          case (?file) { ?file };
        };
      };
    };
  };

  func findFileInPath(folder : Folder, pathParts : [Text]) : ?Storage.ExternalBlob {
    if (pathParts.size() == 0) { return null; };
    let currentPart = pathParts[0];
    let remainingParts = pathParts.sliceToArray(1, pathParts.size() : Nat);
    if (remainingParts.size() == 0) {
      return folder.files.get(currentPart);
    } else {
      switch (folder.subfolders.get(currentPart)) {
        case (null) { null };
        case (?subfolder) { findFileInPath(subfolder, remainingParts) };
      };
    };
  };

  public shared ({ caller }) func uploadTechnicalFileWithFolderPath(path : Text, blob : Storage.ExternalBlob) : async () {
    checkAccess(caller);
    let parts = path.split(#char('/')).toArray();
    if (parts.size() < 2) {
      Runtime.trap("Chemin non valide. Doit inclure au moins un dossier et un nom de fichier");
    };
    let topLevelFolderName = parts[0];
    let fileName = parts[parts.size() - 1];
    let remainingPath = parts.sliceToArray(1, parts.size() - 1 : Nat);
    var topLevelFolder = switch (technicalFolder.get(topLevelFolderName)) {
      case (null) {
        { name = topLevelFolderName; files = Map.empty<Text, Storage.ExternalBlob>(); subfolders = Map.empty<Text, Folder>() };
      };
      case (?folder) { folder };
    };
    topLevelFolder := createSubfoldersAndAddFile(topLevelFolder, remainingPath, fileName, blob);
    technicalFolder.add(topLevelFolderName, topLevelFolder);
  };

  func createSubfoldersAndAddFile(folder : Folder, subfolders : [Text], fileName : Text, blob : Storage.ExternalBlob) : Folder {
    if (subfolders.size() == 0) {
      folder.files.add(fileName, blob);
      return folder;
    };
    let currentFolderName = subfolders[0];
    let remainingSubfolders = subfolders.sliceToArray(1, subfolders.size() : Nat);
    var currentFolder = switch (folder.subfolders.get(currentFolderName)) {
      case (null) {
        let newSubfolder : Folder = { name = currentFolderName; files = Map.empty<Text, Storage.ExternalBlob>(); subfolders = Map.empty<Text, Folder>() };
        newSubfolder;
      };
      case (?existingFolder) { existingFolder };
    };
    currentFolder := createSubfoldersAndAddFile(currentFolder, remainingSubfolders, fileName, blob);
    folder.subfolders.add(currentFolderName, currentFolder);
    folder;
  };

  public shared ({ caller }) func deleteTechnicalFileWithPath(path : Text) : async () {
    checkAccess(caller);
    let parts = path.split(#char('/')).toArray();
    if (parts.size() < 2) {
      Runtime.trap("Chemin non valide. Doit inclure au moins un dossier et un nom de fichier");
    };
    let topLevelFolderName = parts[0];
    let fileName = parts[parts.size() - 1];
    let remainingPath = parts.sliceToArray(1, parts.size() - 1 : Nat);
    switch (technicalFolder.get(topLevelFolderName)) {
      case (null) { Runtime.trap("Dossier de niveau supérieur introuvable") };
      case (?folder) {
        let (fileDeleted, updatedFolder) = deleteFileInPath(folder, remainingPath, fileName);
        if (not fileDeleted) { Runtime.trap("Fichier introuvable dans le chemin spécifié"); };
        if (updatedFolder.files.size() == 0 and updatedFolder.subfolders.size() == 0) {
          technicalFolder.remove(topLevelFolderName);
        } else {
          technicalFolder.add(topLevelFolderName, updatedFolder);
        };
      };
    };
  };

  func deleteFileInPath(folder : Folder, pathParts : [Text], fileName : Text) : (Bool, Folder) {
    if (pathParts.size() == 0) {
      switch (folder.files.get(fileName)) {
        case (null) { (false, folder) };
        case (?_) { folder.files.remove(fileName); (true, folder) };
      };
    } else {
      let currentFolderName = pathParts[0];
      let remainingParts = pathParts.sliceToArray(1, pathParts.size() : Nat);
      switch (folder.subfolders.get(currentFolderName)) {
        case (null) { (false, folder) };
        case (?subfolder) {
          let (fileDeleted, updatedSubfolder) = deleteFileInPath(subfolder, remainingParts, fileName);
          if (fileDeleted) {
            if (updatedSubfolder.files.size() == 0 and updatedSubfolder.subfolders.size() == 0) {
              folder.subfolders.remove(currentFolderName);
            } else {
              folder.subfolders.add(currentFolderName, updatedSubfolder);
            };
          };
          (fileDeleted, folder);
        };
      };
    };
  };

  public shared ({ caller }) func moveTechnicalFile(oldPath : Text, newPath : Text) : async () {
    checkAccess(caller);
    let parts = oldPath.split(#char('/')).toArray();
    if (parts.size() == 0) { Runtime.trap("Chemin invalide") };
    let topLevelFolderName = parts[0];
    let remainingPath = parts.sliceToArray(1, parts.size() : Nat);
    switch (technicalFolder.get(topLevelFolderName)) {
      case (null) { Runtime.trap("Dossier de niveau supérieur introuvable") };
      case (?folder) {
        switch (findFileInPath(folder, remainingPath)) {
          case (null) { Runtime.trap("Le fichier à déplacer n'existe pas") };
          case (?blob) {
            await uploadTechnicalFileWithFolderPath(newPath, blob);
            await deleteTechnicalFileWithPath(oldPath);
          };
        };
      };
    };
  };

  public shared ({ caller }) func createFolder(path : Text) : async () {
    checkAccess(caller);
    let parts = path.split(#char('/')).toArray();
    if (parts.size() == 0) { Runtime.trap("Chemin invalide. Vous devez spécifier le nom du dossier") };
    let topLevelFolderName = parts[0];
    let remainingPath = parts.sliceToArray(1, parts.size());
    var topLevelFolder = switch (technicalFolder.get(topLevelFolderName)) {
      case (null) {
        { name = topLevelFolderName; files = Map.empty<Text, Storage.ExternalBlob>(); subfolders = Map.empty<Text, Folder>() };
      };
      case (?folder) { folder };
    };
    topLevelFolder := createSubfolders(topLevelFolder, remainingPath);
    technicalFolder.add(topLevelFolderName, topLevelFolder);
  };

  func createSubfolders(folder : Folder, subfolders : [Text]) : Folder {
    if (subfolders.size() == 0) { return folder };
    let currentFolderName = subfolders[0];
    let remainingSubfolders = subfolders.sliceToArray(1, subfolders.size() : Nat);
    var currentFolder = switch (folder.subfolders.get(currentFolderName)) {
      case (null) {
        let newSubfolder : Folder = { name = currentFolderName; files = Map.empty<Text, Storage.ExternalBlob>(); subfolders = Map.empty<Text, Folder>() };
        newSubfolder;
      };
      case (?existingFolder) { existingFolder };
    };
    currentFolder := createSubfolders(currentFolder, remainingSubfolders);
    folder.subfolders.add(currentFolderName, currentFolder);
    folder;
  };

  public shared ({ caller }) func renameFolder(oldPath : Text, newName : Text) : async () {
    checkAccess(caller);
    let parts = oldPath.split(#char('/')).toArray();
    if (parts.size() == 0) { Runtime.trap("Chemin invalide. Vous devez spécifier le nom du dossier") };
    let topLevelFolderName = parts[0];
    let remainingPath = parts.sliceToArray(1, parts.size());
    switch (technicalFolder.get(topLevelFolderName)) {
      case (null) { Runtime.trap("Dossier de niveau supérieur introuvable") };
      case (?rootFolder) {
        if (remainingPath.size() == 0) {
          let renamedFolder = { rootFolder with name = newName };
          technicalFolder.remove(topLevelFolderName);
          technicalFolder.add(newName, renamedFolder);
        } else {
          let (renamed, updatedRootFolder) = renameSubfolderInPath(rootFolder, remainingPath, newName);
          if (not renamed) { Runtime.trap("Échec du renommage du dossier dans le chemin spécifié") };
          technicalFolder.add(topLevelFolderName, updatedRootFolder);
        };
      };
    };
  };

  func renameSubfolderInPath(folder : Folder, pathParts : [Text], newName : Text) : (Bool, Folder) {
    if (pathParts.size() == 0) {
      (false, folder);
    } else if (pathParts.size() == 1) {
      let folderToRename = pathParts[0];
      switch (folder.subfolders.get(folderToRename)) {
        case (null) { (false, folder) };
        case (?subfolder) {
          let renamedFolder = { subfolder with name = newName };
          folder.subfolders.remove(folderToRename);
          folder.subfolders.add(newName, renamedFolder);
          (true, folder);
        };
      };
    } else {
      let currentFolderName = pathParts[0];
      let remainingParts = pathParts.sliceToArray(1, pathParts.size() : Nat);
      switch (folder.subfolders.get(currentFolderName)) {
        case (null) { (false, folder) };
        case (?subfolder) {
          let (renamed, updatedSubfolder) = renameSubfolderInPath(subfolder, remainingParts, newName);
          if (renamed) { folder.subfolders.add(currentFolderName, updatedSubfolder) };
          (renamed, folder);
        };
      };
    };
  };

  // Weekly Planning Functionality
  public shared ({ caller }) func createScheduledIntervention(
    clientId : Text,
    clientName : Text,
    assignedEmployee : Principal,
    reason : Text,
    startTime : Text,
    endTime : Text,
    description : Text,
    media : [Storage.ExternalBlob],
    day : Nat,
    month : Nat,
    year : Nat,
    weekNumber : Nat,
    weekYear : Nat,
  ) : async Text {
    checkAccess(caller);
    let id = Time.now().toText();
    let scheduledIntervention : ScheduledIntervention = {
      id;
      clientId;
      clientName;
      assignedEmployee;
      reason;
      startTime;
      endTime;
      description;
      media;
      employeeSignature = null;
      clientSignature = null;
      date = { day; month; year };
      weekNumber;
      weekYear;
      createdBy = caller;
      createdAt = Time.now();
      updatedAt = Time.now();
    };
    scheduledInterventions.add(id, scheduledIntervention);
    id;
  };

  public shared ({ caller }) func updateScheduledIntervention(
    id : Text,
    clientId : Text,
    clientName : Text,
    assignedEmployee : Principal,
    reason : Text,
    startTime : Text,
    endTime : Text,
    description : Text,
    media : [Storage.ExternalBlob],
    employeeSignature : ?Text,
    clientSignature : ?Text,
    day : Nat,
    month : Nat,
    year : Nat,
    weekNumber : Nat,
    weekYear : Nat,
  ) : async () {
    checkAccess(caller);
    switch (scheduledInterventions.get(id)) {
      case (null) { Runtime.trap("Intervention programmée non trouvée") };
      case (?existingIntervention) {
        if (existingIntervention.createdBy != caller and not isAdmin(caller)) {
          Runtime.trap("Non autorisé : vous ne pouvez mettre à jour que vos propres interventions programmées");
        };
        let updatedIntervention : ScheduledIntervention = {
          id; clientId; clientName; assignedEmployee; reason; startTime; endTime; description; media;
          employeeSignature; clientSignature;
          date = { day; month; year };
          weekNumber; weekYear;
          createdBy = existingIntervention.createdBy;
          createdAt = existingIntervention.createdAt;
          updatedAt = Time.now();
        };
        scheduledInterventions.add(id, updatedIntervention);
      };
    };
  };

  public shared ({ caller }) func deleteScheduledIntervention(id : Text) : async () {
    checkAccess(caller);
    switch (scheduledInterventions.get(id)) {
      case (null) { Runtime.trap("Intervention programmée non trouvée") };
      case (?existingIntervention) {
        if (existingIntervention.createdBy != caller and not isAdmin(caller)) {
          Runtime.trap("Non autorisé : vous ne pouvez supprimer que vos propres interventions programmées");
        };
        scheduledInterventions.remove(id);
      };
    };
  };

  public query ({ caller }) func getScheduledInterventionsByWeek(weekNumber : Nat, weekYear : Nat) : async [ScheduledIntervention] {
    checkAccess(caller);
    let matchingInterventions = List.empty<ScheduledIntervention>();
    scheduledInterventions.forEach(
      func(_id, intervention) {
        if (intervention.weekNumber == weekNumber and intervention.weekYear == weekYear) {
          matchingInterventions.add(intervention);
        };
      }
    );
    matchingInterventions.toArray();
  };

  public query ({ caller }) func getScheduledInterventionById(id : Text) : async ?ScheduledIntervention {
    checkAccess(caller);
    scheduledInterventions.get(id);
  };

  public query ({ caller }) func getApprovedEmployees() : async [(Principal, UserProfile)] {
    checkAccess(caller);
    let approvedEmployees = List.empty<(Principal, UserProfile)>();
    userProfiles.forEach(
      func(principal, profile) {
        if (UserApproval.isApproved(approvalState, principal)) {
          approvedEmployees.add((principal, profile));
        };
      }
    );
    approvedEmployees.toArray();
  };

  public shared ({ caller }) func saveWorkHours(
    day : Nat,
    month : Nat,
    year : Nat,
    morningStart : Text,
    morningEnd : Text,
    afternoonStart : Text,
    afternoonEnd : Text,
  ) : async () {
    checkAccess(caller);
    let id = caller.toText() # day.toText() # month.toText() # year.toText();
    let workHours : WorkHours = {
      id;
      employee = caller;
      date = { day; month; year };
      morningStart;
      morningEnd;
      afternoonStart;
      afternoonEnd;
      updatedAt = Time.now();
    };
    workHoursStore.add(id, workHours);
  };

  public query ({ caller }) func getWorkHoursForMonth(employee : Principal, month : Nat, year : Nat) : async [WorkHours] {
    checkAccess(caller);
    let result = List.empty<WorkHours>();
    workHoursStore.forEach(
      func(_id, wh) {
        if (wh.employee == employee and wh.date.month == month and wh.date.year == year) {
          result.add(wh);
        };
      }
    );
    result.toArray();
  };

  public query ({ caller }) func getAllEmployeesWorkHoursForMonth(month : Nat, year : Nat) : async [WorkHours] {
    checkAccess(caller);
    let result = List.empty<WorkHours>();
    workHoursStore.forEach(
      func(_id, wh) {
        if (wh.date.month == month and wh.date.year == year) {
          result.add(wh);
        };
      }
    );
    result.toArray();
  };

  // Internal access check
  func checkAccess(caller : Principal) {
    if (not (isAdmin(caller) or UserApproval.isApproved(approvalState, caller))) {
      Runtime.trap("Non autorisé");
    };
  };
};
