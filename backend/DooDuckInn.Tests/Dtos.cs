namespace DooDuckInn.Tests;

// Local response shapes for deserializing API responses in tests. The real domain types
// (User/Tax/Supplier/Item/Transaction) don't expose public constructors/setters System.Text.Json
// can use on the way in, so tests read into these plain records instead of the domain types themselves.
public record UserDto(int Id, string CognitoSub, string Email);
public record TaxDto(int Id, int UserId, DateOnly StartDate, DateOnly EndDate, bool IsSent);
public record SupplierDto(int Id, int UserId, string Name, string Email, string Phone);
public record ItemDto(int Id, int SupplierId, string Name, int Quantity);
public record TransactionDto(int Id, int TaxId, string Name, double Amount, double Gst, int Type);
