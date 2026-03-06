import Map "mo:core/Map";
import List "mo:core/List";
import Blob "mo:core/Blob";
import Auth "authorization/access-control";
import UserApproval "user-approval/approval";

module {
  type OldActor = {
    approvalState : UserApproval.UserApprovalState;
    accessControlState : Auth.AccessControlState;
    clients : Map.Map<Text, OldClient>;
    interventions : Map.Map<Text, List.List<OldIntervention>>;
    technicalFolder : Map.Map<Text, OldFolder>;
    userProfiles : Map.Map<Principal, OldUserProfile>;
    mediaStorage : Map.Map<Text, OldMediaItem>;
  };

  type OldClient = {
    info : OldContactInfo;
    isBlacklisted : Bool;
    blacklistComments : Text;
    blacklistMedia : [Blob];
    updatedAt : Int;
  };

  type OldAddress = {
    street : Text;
    city : Text;
    state : Text;
    zip : Text;
  };

  type OldContactInfo = {
    name : Text;
    address : OldAddress;
    phone : Text;
    email : Text;
  };

  type OldIntervention = {
    id : Text;
    clientId : Text;
    employee : Principal;
    comments : Text;
    media : [Blob];
    date : { day : Nat; month : Nat; year : Nat };
    interventionTimestamp : Int;
    updatedAt : Int;
    canEdit : Bool;
    canDelete : Bool;
  };

  type OldUserProfile = {
    name : Text;
  };

  type OldMediaItem = {
    id : Text;
    owner : Principal;
    file : Blob;
    createdAt : Int;
  };

  type OldFolder = {
    name : Text;
    files : Map.Map<Text, Blob>;
    subfolders : Map.Map<Text, OldFolder>;
  };

  type NewActor = {
    approvalState : UserApproval.UserApprovalState;
    accessControlState : Auth.AccessControlState;
    clients : Map.Map<Text, NewClient>;
    interventions : Map.Map<Text, List.List<NewIntervention>>;
    technicalFolder : Map.Map<Text, NewFolder>;
    userProfiles : Map.Map<Principal, NewUserProfile>;
    mediaStorage : Map.Map<Text, NewMediaItem>;
    adminAssigned : Bool;
  };

  type NewClient = {
    info : NewContactInfo;
    isBlacklisted : Bool;
    blacklistComments : Text;
    blacklistMedia : [Blob];
    updatedAt : Int;
  };

  type NewAddress = {
    street : Text;
    city : Text;
    state : Text;
    zip : Text;
  };

  type NewContactInfo = {
    name : Text;
    address : NewAddress;
    phone : Text;
    email : Text;
  };

  type NewIntervention = {
    id : Text;
    clientId : Text;
    employee : Principal;
    comments : Text;
    media : [Blob];
    date : { day : Nat; month : Nat; year : Nat };
    interventionTimestamp : Int;
    updatedAt : Int;
    canEdit : Bool;
    canDelete : Bool;
  };

  type NewUserProfile = {
    name : Text;
  };

  type NewMediaItem = {
    id : Text;
    owner : Principal;
    file : Blob;
    createdAt : Int;
  };

  type NewFolder = {
    name : Text;
    files : Map.Map<Text, Blob>;
    subfolders : Map.Map<Text, NewFolder>;
  };

  public func run(old : OldActor) : NewActor {
    { old with adminAssigned = false };
  };
};
