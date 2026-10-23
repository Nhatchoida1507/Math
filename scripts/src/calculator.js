import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";

const terminal = createInterface({ input: stdin, output: stdout });

try {
  const expression = (
    await terminal.question("Nhập phép tính (ví dụ: 10 + 5): ")
  ).trim();
  const match = expression.match(
    /^(-?(?:\d+(?:\.\d*)?|\.\d+))\s*([+\-*\/])\s*(-?(?:\d+(?:\.\d*)?|\.\d+))$/,
  );

  if (!match) {
    console.log("Nhập theo dạng: số phép_tính số (ví dụ: 10 + 5).");
    process.exitCode = 1;
  } else {
    const firstNumber = Number(match[1]);
    const operator = match[2];
    const secondNumber = Number(match[3]);

    if (!Number.isFinite(firstNumber) || !Number.isFinite(secondNumber)) {
      console.log("Vui lòng nhập hai số hợp lệ.");
      process.exitCode = 1;
    } else if (operator === "/" && secondNumber === 0) {
      console.log("Không thể chia cho 0.");
      process.exitCode = 1;
    } else {
      let result;

      switch (operator) {
        case "+":
          result = firstNumber + secondNumber;
          break;
        case "-":
          result = firstNumber - secondNumber;
          break;
        case "*":
          result = firstNumber * secondNumber;
          break;
        case "/":
          result = firstNumber / secondNumber;
          break;
      }

      console.log(`Kết quả: ${result}`);
    }
  }
} finally {
  terminal.close();
}
