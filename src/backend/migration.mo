import Map "mo:core/Map";
import List "mo:core/List";
import Principal "mo:core/Principal";
import Storage "blob-storage/Storage";

module {
  type OldClient = {
    info : {
      name : Text;
      address : {
        street : Text;
        city : Text;
        state : Text;
        zip : Text;
      };
      phone : Text;
      email : Text;
    };
    isBlacklisted : Bool;
    blacklistComments : Text;
    blacklistMedia : [Storage.ExternalBlob];
    updatedAt : Int;
  };

  type OldIntervention = {
    id : Text;
    clientId : Text;
    employee : Principal;
    comments : Text;
    media : [Storage.ExternalBlob];
    date : { day : Nat; month : Nat; year : Nat };
    interventionTimestamp : Int;
    updatedAt : Int;
    canEdit : Bool;
    canDelete : Bool;
  };

  type OldActor = {
    clients : Map.Map<Text, OldClient>;
    interventions : Map.Map<Text, List.List<OldIntervention>>;
    userProfiles : Map.Map<Principal, { name : Text }>;
  };

  type NewActor = {
    clients : Map.Map<Text, OldClient>;
    technicalFolder : Map.Map<Text, Storage.ExternalBlob>;
    interventions : Map.Map<Text, List.List<OldIntervention>>;
    userProfiles : Map.Map<Principal, { name : Text }>;
  };

  public func run(old : OldActor) : NewActor {
    { old with technicalFolder = Map.empty<Text, Storage.ExternalBlob>() };
  };
};
