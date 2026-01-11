# Firebase Setup for DocLock

To get the app working with Firebase, follow these steps:

1.  **Create a Firebase Project**: Go to [Firebase Console](https://console.firebase.google.com/) and create a new project.
2.  **Add a Web App**: In the project settings, add a new "Web" app.
3.  **Get Credentials**: Once created, you will see an object containing `apiKey`, `authDomain`, etc.
4.  **Configure Environment Variables**:
    - Copy the contents of `.env.example` to a new file named `.env`.
    - Fill in the values with your actual credentials.
5.  **Enable Services**:
    - **Authentication**: Enable "Phone" or "Email/Password" sign-in methods in the Auth tab.
    - **Firestore**: Create a database in the Firestore tab.
    - **Storage**: Set up storage in the Storage tab.

> [!NOTE]
> Ensure that your environment variables are correctly loaded in your development environment.
