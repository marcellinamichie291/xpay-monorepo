import { Button, Input, Typography } from "antd";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { useState } from "react";
import { FIREBASE_AUTH } from "../config";

const { Title } = Typography;

function SignUp(props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function submit() {
    createUserWithEmailAndPassword(FIREBASE_AUTH, email, password)
      .catch((error) => {
        console.error(error);
      });
  }

  return (
    <div>
      <Title level={4}>Sign Up</Title>
      <Input placeholder="Email" onChange={(e) => setEmail(e.target.value)} />
      <Input.Password placeholder="Password" onChange={(e) => setPassword(e.target.value)} />
      <div style={{ display: "flex" }}>
        Already have an account?
        <div className="text-link" onClick={() => props.onSwitch()}> Login </div>
        instead.
      </div>
      <Button type="primary" onClick={submit}>Sign Up</Button>
    </div>
  );
}

export default SignUp;