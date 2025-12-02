from django.contrib import admin
from .models import User, Email

# Register your models here.
class EmailAdmin(admin.ModelAdmin):
    list_display = ("id","user", "sender", "subject", "display_recipients", "timestamp")

    def display_recipients(self, obj):
        return ", ".join([user.email for user in obj.recipients.all()])

    def __str__(self):
        return f"{self.sender} to {self.recipients}"

admin.site.register(User)
admin.site.register(Email, EmailAdmin)