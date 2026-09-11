using DooDuckInn.src.db;
using Microsoft.EntityFrameworkCore;

namespace DooDuckInn.src.users;

public class UsersService(AppDbContext db)
{
    public async Task<User> GetById(int id)
    {
        var user = await db.Users.FirstOrDefaultAsync(u => u.Id == id);

        if (user is null) throw new KeyNotFoundException($"User {id} not found");

        return user;
    }

    public async Task<User> GetBySubAsync(string sub)
    {
        var user = await db.Users.FirstOrDefaultAsync(u => u.CognitoSub == sub);

        if (user is null) throw new KeyNotFoundException("User not found");

        return user;
    }

    public async Task<User> CreateAsync(string cognitosub)
    {
        var user = new User(cognitosub);
        db.Users.Add(user);
        await db.SaveChangesAsync();
        return user;
    }

    public async Task<bool> UpdateEmailAsync(int id, UpdateEmailRequest req)
    {
        User? user = await db.Users.FindAsync(id);
        if (user is null) return false;

        user.UpdateEmail(req.Email);
        await db.SaveChangesAsync();
        return true;
    }
}
