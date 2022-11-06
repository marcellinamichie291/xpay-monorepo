import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from "react";
import LoginOrSignUp from "./components/LoginOrSignUp";
import Home from "./components/Home";
import { FIREBASE_AUTH } from "./config";

function Root() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(FIREBASE_AUTH, (user) => {
      if (user) {
        // User is signed in, see docs for a list of available properties
        // https://firebase.google.com/docs/reference/js/firebase.User
        setUser(user);
      } else {
        // User is signed out
        // ...
        setUser(null);
      }
    });

    return () => unsubscribe();
  })

  return user ? <Home user={user} /> : <LoginOrSignUp />;
}

export default Root;
