import { Button, Input, Typography } from "antd";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useState } from "react";
import { FIREBASE_AUTH } from "../config";

const { Title } = Typography;

function Login(props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function submit() {
    signInWithEmailAndPassword(FIREBASE_AUTH, email, password)
      .catch((error) => {
        console.error(error);
      });
  }

  return (
    <div>
      <Title level={4}>Login</Title>
      <Input placeholder="Email" onChange={(e) => setEmail(e.target.value)} />
      <Input.Password placeholder="Password" onChange={(e) => setPassword(e.target.value)} />
      <div style={{ display: "flex" }}>
        Don't have an account?
        <div className="text-link" onClick={() => props.onSwitch()}>Sign up</div>
        instead.
      </div>
      <Button type="primary" onClick={submit}>Login</Button>
    </div>
  );
}

export default Login;