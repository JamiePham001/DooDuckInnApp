using System.Dynamic;
using System.Runtime.InteropServices;
using DooDuckInn.Domain.GeneralServiceTaxes;
using DooDuckInn.Domain.Suppliers;
using static System.Runtime.InteropServices.JavaScript.JSType;

namespace DooDuckInn.Domain.Users;

public sealed class User
{
    public int Id { get; private set; }     // EF Core + Npgsql auto-configures this as IDENTITY
    public string CognitoSub {get; private set;} = string.Empty;
    public string Email {get; private set;} = string.Empty;
    public string Abn {get; private set;} = "1234 5678";

    public ICollection<GeneralServiceTax> GeneralServiceTaxes {get; private set;} = [];
    public ICollection<Supplier> Suppliers { get; private set; } = [];

    public User(string cognitosub)
    {
        if (string.IsNullOrEmpty(cognitosub))
        {
            throw new Exception("CognitoSub is required");
        }

        CognitoSub = cognitosub;

    }

    public void ChangeDetails([Optional] string email, [Optional] string abn)
    {
        // add input checks for email and abn
        Email = email;
        Abn = abn;
    }

    public void AddGST(DateOnly startDate, DateOnly endDate)
    {
        var gst = new GeneralServiceTax(this, startDate, endDate);
        GeneralServiceTax.Add(gst);
    }
}
