import {
  TextField,
  TextFieldProps,
} from "@material-ui/core";

export default function NumberTextField({
  onMaxClick,
  ...props
}: TextFieldProps & { onMaxClick?: () => void }) {
  return (
    <TextField
      type="number"
      {...props}
    ></TextField>
  );
}
