import React from "react";
import { styled } from "@mui/material/styles";
import Radio, { type RadioProps } from "@mui/material/Radio";

/**
 * Styled span representing the unchecked radio button circle
 */
const BpIcon = styled("span")(({ theme }) => ({
  borderRadius: "50%",
  width: 18,
  height: 18,
  boxShadow: "inset 0 0 0 1px rgba(16,22,26,.2), inset 0 -1px 0 rgba(16,22,26,.1)",
  backgroundColor: "#f5f8fa",
  backgroundImage: "linear-gradient(180deg,hsla(0,0%,100%,.8),hsla(0,0%,100%,0))",
  transition: "all 0.15s ease-in-out",
  ".Mui-focusVisible &": {
    outline: `2px auto ${theme.palette.primary.main}`,
    outlineOffset: 2,
  },
  "input:hover ~ &": {
    backgroundColor: "#ebf1f5",
  },
  "input:disabled ~ &": {
    boxShadow: "none",
    background: "rgba(206,217,224,.5)",
  },
  ".dark &": {
    backgroundColor: "#18181b",
    boxShadow: "inset 0 0 0 1.5px rgba(255,255,255,.35), inset 0 -1px 0 rgba(255,255,255,.1)",
    backgroundImage: "linear-gradient(180deg,rgba(255,255,255,.05),rgba(255,255,255,0))",
  },
  ".dark input:hover ~ &": {
    backgroundColor: "#27272a",
    boxShadow: "inset 0 0 0 1.5px rgba(255,255,255,.55)",
  },
}));

/**
 * Styled span representing the checked radio button circle with radial inner dot
 */
const BpCheckedIcon = styled(BpIcon)(({ theme }) => ({
  backgroundColor: theme.palette.primary.main,
  backgroundImage: "linear-gradient(180deg,hsla(0,0%,100%,.1),hsla(0,0%,100%,0))",
  boxShadow: `inset 0 0 0 1px ${theme.palette.primary.main}`,
  "&::before": {
    display: "block",
    width: 18,
    height: 18,
    backgroundImage: "radial-gradient(#fff,#fff 28%,transparent 32%)",
    content: '""',
  },
  "input:hover ~ &": {
    backgroundColor: theme.palette.primary.dark || "#1d4ed8",
  },
  ".dark &": {
    backgroundColor: "#ffffff",
    boxShadow: "inset 0 0 0 1px #ffffff",
    backgroundImage: "none",
    "&::before": {
      display: "block",
      width: 18,
      height: 18,
      backgroundImage: "radial-gradient(#18181b,#18181b 28%,transparent 32%)",
      content: '""',
    },
  },
  ".dark input:hover ~ &": {
    backgroundColor: "#f4f4f5",
  },
}));

/**
 * Custom Blueprint-styled Radio button matching the project's theme and visual standards
 *
 * @param props - Material UI RadioProps
 * @returns Rendered custom styled Radio button
 */
export const CustomRadio: React.FC<RadioProps> = (props) => {
  return (
    <Radio
      disableRipple
      color="default"
      checkedIcon={<BpCheckedIcon />}
      icon={<BpIcon />}
      {...props}
    />
  );
};

export default CustomRadio;
