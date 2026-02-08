module {
  public type Actor = {
    // No persistent state change; migration is a no-op
  };

  public func run(old : Actor) : Actor {
    old;
  };
};
