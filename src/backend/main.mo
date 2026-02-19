import List "mo:core/List";
import Array "mo:core/Array";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Order "mo:core/Order";
import Map "mo:core/Map";
import Iter "mo:core/Iter";
import Runtime "mo:core/Runtime";
import Auth "authorization/access-control";
import Principal "mo:core/Principal";
import MixinStorage "blob-storage/Mixin";
import Storage "blob-storage/Storage";
import MixinAuthorization "authorization/MixinAuthorization";

actor {
  let clients = Map.empty<Text, Client>();
  type Folder = {
    name : Text;
    files : Map.Map<Text, Storage.ExternalBlob>;
    subfolders : Map.Map<Text, Folder>;
  };

  // Top-level technical folder state
  let technicalFolder = Map.empty<Text, Folder>();
  let interventions = Map.empty<Text, List.List<Intervention>>();
  let userProfiles = Map.empty<Principal, UserProfile>();
  let accessControlState = Auth.initState();

  include MixinStorage();
  include MixinAuthorization(accessControlState);

  module Client {
    public func compare(client1 : Client, client2 : Client) : Order.Order {
      client1.info.name.compare(client2.info.name);
    };
  };

  public type Address = {
    street : Text;
    city : Text;
    state : Text;
    zip : Text;
  };

  public type ContactInfo = {
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

  // User Profile methods
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (Auth.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Non autorisé : seuls les utilisateurs peuvent voir les profils");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not Auth.isAdmin(accessControlState, caller)) {
      Runtime.trap("Non autorisé : vous ne pouvez voir que votre propre profil");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (Auth.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Non autorisé : seuls les utilisateurs peuvent enregistrer des profils");
    };
    userProfiles.add(caller, profile);
  };

  // Client methods
  public query ({ caller }) func getClients() : async [Client] {
    if (not (Auth.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Non autorisé : seuls les utilisateurs authentifiés peuvent voir les clients");
    };
    clients.values().toArray().sort();
  };

  public query ({ caller }) func getClient(clientId : Text) : async Client {
    if (not (Auth.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Non autorisé : seuls les utilisateurs authentifiés peuvent voir les clients");
    };
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
    if (not (Auth.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Non autorisé : seuls les utilisateurs authentifiés peuvent créer ou mettre à jour des clients");
    };
    switch (clients.get(id)) {
      case (null) {
        let newClient : Client = {
          info = {
            name;
            address;
            phone;
            email;
          };
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
          info = {
            name;
            address;
            phone;
            email;
          };
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
    if (not (Auth.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Non autorisé : seuls les utilisateurs authentifiés peuvent rechercher des clients");
    };
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
    if (not (Auth.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Non autorisé : seuls les utilisateurs authentifiés peuvent marquer les clients comme sur la liste noire");
    };
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
    if (not (Auth.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Non autorisé : seuls les utilisateurs authentifiés peuvent désigner les clients comme sur la liste noire");
    };
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

  // Intervention management
  public shared ({ caller }) func addIntervention(
    clientId : Text,
    comments : Text,
    media : [Storage.ExternalBlob],
    day : Nat,
    month : Nat,
    year : Nat,
  ) : async () {
    if (not (Auth.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Non autorisé : seuls les utilisateurs authentifiés peuvent ajouter des interventions");
    };
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
    if (not (Auth.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Non autorisé : seuls les utilisateurs authentifiés peuvent voir les interventions");
    };
    switch (interventions.get(clientId)) {
      case (null) { [] };
      case (?list) {
        list.toArray().map(
          func(intervention) {
            if (intervention.employee == caller) {
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
    if (not (Auth.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Non autorisé : seuls les utilisateurs authentifiés peuvent mettre à jour les interventions");
    };
    switch (interventions.get(clientId)) {
      case (null) { Runtime.trap("Client non trouvé") };
      case (?list) {
        let interventionArray = list.toArray();
        var found = false;
        let updatedArray = interventionArray.map(
          func(intervention) {
            if (intervention.id == interventionId) {
              if (intervention.employee != caller) {
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
    if (not (Auth.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Non autorisé : seuls les utilisateurs authentifiés peuvent supprimer des interventions");
    };
    switch (interventions.get(clientId)) {
      case (null) { Runtime.trap("Client non trouvé") };
      case (?list) {
        let interventionArray = list.toArray();
        var found = false;
        let filteredArray = interventionArray.filter(
          func(intervention) {
            if (intervention.id == interventionId) {
              if (intervention.employee != caller) {
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
    if (not (Auth.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Non autorisé : seuls les utilisateurs authentifiés peuvent accéder aux interventions");
    };

    let matchingInterventions = List.empty<Intervention>();

    interventions.forEach(
      func(_clientId, interventionsList) {
        for (intervention : Intervention in interventionsList.values()) {
          if (
            intervention.date.day == day and intervention.date.month == month and intervention.date.year == year
          ) {
            matchingInterventions.add(intervention);
          };

        };
      }
    );

    matchingInterventions.toArray();
  };

  // Technical Folder Management
  public query ({ caller }) func listTechnicalFiles() : async [(Text, Storage.ExternalBlob)] {
    if (not (Auth.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Non autorisé : seuls les utilisateurs authentifiés peuvent répertorier les fichiers techniques");
    };
    let result = List.empty<(Text, Storage.ExternalBlob)>();

    // Recursive helper to traverse folder tree
    func traverseFolderTree(folder : Folder, path : Text) {
      folder.files.toArray().forEach(
        func(file) {
          result.add((path.concat(file.0), file.1));
        }
      );
      folder.subfolders.toArray().forEach(
        func(subfolder) {
          traverseFolderTree(subfolder.1, path.concat(subfolder.0).concat("/"));
        }
      );
    };

    technicalFolder.forEach(
      func(folderName, folder) {
        traverseFolderTree(folder, folderName.concat("/"));
      }
    );

    result.toArray();
  };

  public query ({ caller }) func downloadTechnicalFileWithPath(path : Text) : async ?Storage.ExternalBlob {
    if (not (Auth.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Non autorisé : seuls les utilisateurs authentifiés peuvent télécharger des fichiers techniques");
    };

    let parts = path.split(#char('/')).toArray();
    if (parts.size() == 0) {
      return null;
    };

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

  // Helper function to recursively find file in path hierarchy
  func findFileInPath(folder : Folder, pathParts : [Text]) : ?Storage.ExternalBlob {
    if (pathParts.size() == 0) {
      return null;
    };

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
    if (not (Auth.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Non autorisé : seuls les utilisateurs authentifiés peuvent télécharger des fichiers techniques");
    };

    let parts = path.split(#char('/')).toArray();
    if (parts.size() < 2) {
      Runtime.trap("Chemin non valide. Doit inclure au moins un dossier et un nom de fichier");
    };

    let topLevelFolderName = parts[0];
    let fileName = parts[parts.size() - 1];
    let remainingPath = parts.sliceToArray(1, parts.size() - 1 : Nat);

    // Get or create top-level folder
    let topLevelFolder = switch (technicalFolder.get(topLevelFolderName)) {
      case (null) {
        {
          name = topLevelFolderName;
          files = Map.empty<Text, Storage.ExternalBlob>();
          subfolders = Map.empty<Text, Folder>();
        };
      };
      case (?folder) { folder };
    };

    // Recursively create/get subfolders
    let finalFolder = createSubfolders(topLevelFolder, remainingPath);

    // Add file to final folder
    finalFolder.files.add(fileName, blob);
    technicalFolder.add(topLevelFolderName, topLevelFolder);
  };

  // Helper function to create/find nested subfolders
  func createSubfolders(folder : Folder, subfolders : [Text]) : Folder {
    if (subfolders.size() == 0) {
      return folder;
    };

    let currentFolderName = subfolders[0];
    let remainingSubfolders = subfolders.sliceToArray(1, subfolders.size() : Nat);

    let currentFolder = switch (folder.subfolders.get(currentFolderName)) {
      case (null) {
        let newSubfolder : Folder = {
          name = currentFolderName;
          files = Map.empty<Text, Storage.ExternalBlob>();
          subfolders = Map.empty<Text, Folder>();
        };
        folder.subfolders.add(currentFolderName, newSubfolder);
        newSubfolder;
      };
      case (?existingFolder) { existingFolder };
    };

    createSubfolders(currentFolder, remainingSubfolders);
  };

  public shared ({ caller }) func deleteTechnicalFileWithPath(path : Text) : async () {
    if (not (Auth.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Non autorisé : seuls les utilisateurs authentifiés peuvent supprimer des fichiers techniques");
    };

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
        switch (deleteFileInPath(folder, remainingPath, fileName)) {
          case (true) {
            if (remainingPath.size() == 0 and folder.files.size() == 0 and folder.subfolders.size() == 0) {
              technicalFolder.remove(topLevelFolderName);
            };
          };
          case (false) { Runtime.trap("Fichier introuvable dans le chemin spécifié") };
        };
      };
    };
  };

  // Helper function to recursively delete file in path hierarchy
  func deleteFileInPath(folder : Folder, pathParts : [Text], fileName : Text) : Bool {
    if (pathParts.size() == 0) {
      switch (folder.files.get(fileName)) {
        case (null) { false };
        case (?_) {
          folder.files.remove(fileName);
          true;
        };
      };
    } else {
      let currentFolderName = pathParts[0];
      let remainingParts = pathParts.sliceToArray(1, pathParts.size() : Nat);

      switch (folder.subfolders.get(currentFolderName)) {
        case (null) { false };
        case (?subfolder) {
          let fileDeleted = deleteFileInPath(subfolder, remainingParts, fileName);
          if (fileDeleted and subfolder.files.size() == 0 and subfolder.subfolders.size() == 0) {
            folder.subfolders.remove(currentFolderName);
          };
          fileDeleted;
        };
      };
    };
  };

  public shared ({ caller }) func moveTechnicalFile(
    oldPath : Text,
    newPath : Text,
  ) : async () {
    if (not (Auth.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: only authenticated users can move technical files");
    };

    // Find the file at the old path
    switch (await downloadTechnicalFileWithPath(oldPath)) {
      case (?blob) {
        // Upload the file to the new path
        await uploadTechnicalFileWithFolderPath(newPath, blob);

        // Delete the original file from the old path
        await deleteTechnicalFileWithPath(oldPath);
      };
      case (null) { Runtime.trap("The file to be moved does not exist") };
    };
  };
};
