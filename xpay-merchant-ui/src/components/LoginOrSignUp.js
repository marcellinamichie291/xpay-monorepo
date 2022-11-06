import { useState } from "react";
import Login from "./Login";
import SignUp from "./SignUp"

function LoginOrSignUp() {
  const [isLogin, setIsLogin] = useState(true);

  const form = isLogin ? (
    <Login onSwitch={() => setIsLogin(false)} />
  ) : (
    <SignUp onSwitch={() => setIsLogin(true)} />
  );

  return (
    <div className="login-form">
      {form}
    </div>
  );
}

export default LoginOrSignUp;