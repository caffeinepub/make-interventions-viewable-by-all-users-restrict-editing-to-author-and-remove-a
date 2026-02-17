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
import Migration "migration";

// Set up migration function
(with migration = Migration.run)
actor {
  // Fields
  let clients = Map.empty<Text, Client>();
  var technicalFolder = Map.empty<Text, Storage.ExternalBlob>();
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
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not Auth.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (Auth.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Client methods
  public query ({ caller }) func getClients() : async [Client] {
    if (not (Auth.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view clients");
    };
    clients.values().toArray().sort();
  };

  public query ({ caller }) func getClient(clientId : Text) : async Client {
    if (not (Auth.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view clients");
    };
    switch (clients.get(clientId)) {
      case (null) { Runtime.trap("Client not found") };
      case (?client) { client };
    };
  };

  public shared ({ caller }) func createOrUpdateClient(id : Text, name : Text, address : Address, phone : Text, email : Text) : async () {
    if (not (Auth.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can create or update clients");
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
          Runtime.trap("Blacklisted clients cannot be updated");
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
      Runtime.trap("Unauthorized: Only authenticated users can search clients");
    };
    let matches = clients.values().filter(
      func(client) {
        client.info.name.toLower().contains(#text(searchString.toLower()));
      }
    );
    matches.toArray();
  };

  public shared ({ caller }) func markAsBlacklisted(clientId : Text, comments : Text, media : [Storage.ExternalBlob]) : async () {
    if (not (Auth.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can mark clients as blacklisted");
    };
    switch (clients.get(clientId)) {
      case (null) { Runtime.trap("Client not found") };
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
      Runtime.trap("Unauthorized: Only authenticated users can unmark clients as blacklisted");
    };
    switch (clients.get(clientId)) {
      case (null) { Runtime.trap("Client not found") };
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
  public shared ({ caller }) func addIntervention(clientId : Text, comments : Text, media : [Storage.ExternalBlob], day : Nat, month : Nat, year : Nat) : async () {
    if (not (Auth.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can add interventions");
    };
    switch (clients.get(clientId)) {
      case (null) { Runtime.trap("Client not found") };
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
      Runtime.trap("Unauthorized: Only authenticated users can view interventions");
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

  public shared ({ caller }) func updateIntervention(interventionId : Text, clientId : Text, comments : Text, media : [Storage.ExternalBlob], day : Nat, month : Nat, year : Nat) : async () {
    if (not (Auth.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can update interventions");
    };
    switch (interventions.get(clientId)) {
      case (null) { Runtime.trap("Client not found") };
      case (?list) {
        let interventionArray = list.toArray();
        var found = false;
        let updatedArray = interventionArray.map(
          func(intervention) {
            if (intervention.id == interventionId) {
              if (intervention.employee != caller) {
                Runtime.trap("Unauthorized: You can only update your own interventions");
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
          Runtime.trap("Intervention not found");
        };
        let updatedList = List.fromArray<Intervention>(updatedArray);
        interventions.add(clientId, updatedList);
      };
    };
  };

  public shared ({ caller }) func deleteIntervention(interventionId : Text, clientId : Text) : async () {
    if (not (Auth.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can delete interventions");
    };
    switch (interventions.get(clientId)) {
      case (null) { Runtime.trap("Client not found") };
      case (?list) {
        let interventionArray = list.toArray();
        var found = false;
        let filteredArray = interventionArray.filter(
          func(intervention) {
            if (intervention.id == interventionId) {
              if (intervention.employee != caller) {
                Runtime.trap("Unauthorized: You can only delete your own interventions");
              };
              found := true;
              false;
            } else {
              true;
            };
          }
        );
        if (not found) {
          Runtime.trap("Intervention not found");
        };
        let updatedList = List.fromArray<Intervention>(filteredArray);
        interventions.add(clientId, updatedList);
      };
    };
  };

  // Technical Folder Management
  public query ({ caller }) func listTechnicalFiles() : async [(Text, Storage.ExternalBlob)] {
    if (not (Auth.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can list technical files");
    };
    technicalFolder.toArray();
  };

  public shared ({ caller }) func uploadTechnicalFile(fileId : Text, blob : Storage.ExternalBlob) : async () {
    if (not (Auth.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can upload technical files");
    };
    technicalFolder.add(fileId, blob);
  };

  public shared ({ caller }) func deleteTechnicalFile(fileId : Text) : async () {
    if (not (Auth.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can delete technical files");
    };
    switch (technicalFolder.get(fileId)) {
      case (null) { Runtime.trap("File not found") };
      case (?_) { technicalFolder.remove(fileId) };
    };
  };
};
