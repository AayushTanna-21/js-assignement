// Calculator state
const calculator = {
  displayValue: "0",
  firstOperand: null,
  secondOperand: null, // <-- add this
  lastOperator: null, // <-- add this
  lastOperand: null,
  waitingForSecondOperand: false,
  operator: null,
  memory: 0,
  memoryHistory: [],
  isSecondMode: false,
  isDegMode: true,
  isFEMode: false,
  history: [],
  currentExpression: "",
};
// DOM Elements
const display = document.getElementById("display");
const historyList = document.getElementById("history-list");
const secondBtn = document.getElementById("second-btn");
const degRadBtn = document.getElementById("deg-rad-btn");
const feBtn = document.getElementById("fe-btn");
const clearHistoryBtn = document.getElementById("clear-history");
const trigBtn = document.getElementById("tri-btnx");
const trigContainer = document.getElementById("trigContainer");
const expressionDisplay = document.getElementById("expression-display");
const memoryPopup = document.getElementById("memory-popup");
const memoryPopupList = document.getElementById("memory-popup-list");
// helper function to update expression line
function updateExpressionDisplay() {
  expressionDisplay.textContent = calculator.currentExpression;
}
if (trigBtn && trigContainer) {
  // Toggle grid on trig button click
  trigBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    trigContainer.classList.toggle("show");
  });
  // Prevent clicks inside trig container from closing it
  trigContainer.addEventListener("click", (e) => {
    e.stopPropagation();
  });

  // Click anywhere else closes the container
  document.addEventListener("click", () => {
    trigContainer.classList.remove("show");
  });

  // Optional: close when pressing Escape
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") trigContainer.classList.remove("show");
  });
}
function renderMemoryPopup() {
  memoryPopupList.innerHTML = "";
  if (calculator.memoryHistory.length === 0) {
    memoryPopupList.innerHTML = '<div class="empty-memory">No memory yet</div>';
    return;
  }
  calculator.memoryHistory
    .slice()
    .reverse()
    .forEach((val) => {
      const div = document.createElement("div");
      div.className = "memory-item";
      div.textContent = val;
      div.addEventListener("click", () => {
        calculator.displayValue = val.toString();
        updateDisplay();
      });
      memoryPopupList.appendChild(div);
    });
}

function toggleMemoryPopup() {
  memoryPopup.classList.toggle("show");
  renderMemoryPopup();
}
function handleMemoryFunction(func) {
  const value = parseFloat(calculator.displayValue);

  switch (func) {
    case "mc":
      calculator.memory = 0;
      calculator.memoryHistory = [];
      break;
    case "m-plus":
      calculator.memory += value;
      calculator.memoryHistory.push(calculator.memory);
      break;
    case "m-minus":
      calculator.memory -= value;
      calculator.memoryHistory.push(calculator.memory);
      break;
    case "ms":
      calculator.memory = value;
      calculator.memoryHistory.push(calculator.memory);
      break;
    case "m":
      toggleMemoryPopup();
      break;
  }
  if (memoryPopup.classList.contains("show")) {
    renderMemoryPopup();
  }
}
updateDisplay();
document.querySelectorAll(".tri-fun").forEach((btn) => {
  btn.addEventListener("click", () => {
    const action = btn.dataset.action;
    let currentValue = parseFloat(display.textContent);
    if (isNaN(currentValue)) return;
    const angle = calculator.isDegMode
      ? (currentValue * Math.PI) / 180
      : currentValue;
    let result;
    switch (action) {
      case "sin":
        result = Math.sin(angle);
        break;
      case "cos":
        result = Math.cos(angle);
        break;
      case "tan":
        result = Math.tan(angle);
        break;
      case "csc": // cosecant = 1/sin
        result = 1 / Math.sin(angle);
        break;
      case "sec": // secant = 1/cos
        result = 1 / Math.cos(angle);
        break;
      case "cot": // cotangent = 1/tan
        result = 1 / Math.tan(angle);
        break;
    }
    updateDisplay();
    trigContainer.classList.remove("show");
  });
});
// Update display
function updateDisplay() {
  let value = calculator.displayValue;
  if (calculator.isFEMode && value !== "Error") {
    const num = parseFloat(value);
    if (!isNaN(num)) {
      value = num.toExponential(6);
    }
  }
  display.textContent = value;
}
function addToHistory(expression, result) {
  let formattedResult = result;
  if (calculator.isFEMode && result !== "Error") {
    const num = parseFloat(result);
    if (!isNaN(num)) {
      formattedResult = num.toExponential(6);
    }
  }
  calculator.history.unshift({ expression, result });
  historyList.innerHTML = "";
  if (calculator.history.length === 0) {
    historyList.innerHTML =
      '<div class="empty-history">No calculations yet</div>';
    return;
  }
  calculator.history.forEach((item) => {
    const historyItem = document.createElement("div");
    historyItem.className = "history-item";
    historyItem.innerHTML = `
                    <div class="history-expression">${item.expression}</div>
                    <div class="history-result">= ${item.result}</div>
                `;
    historyItem.addEventListener("click", () => {
      calculator.displayValue = item.result;
      updateDisplay();
    });
    historyList.appendChild(historyItem);
  });
}
function inputDigit(digit) {
  const { displayValue, waitingForSecondOperand } = calculator;

  if (waitingForSecondOperand) {
    calculator.displayValue = digit;
    calculator.waitingForSecondOperand = false;
    calculator.secondOperand = parseFloat(digit); // save start of second operand
  } else {
    calculator.displayValue =
      displayValue === "0" ? digit : displayValue + digit;
    if (calculator.operator) {
      // we are typing the second operand
      calculator.secondOperand = parseFloat(calculator.displayValue);
    }
  }
  calculator.currentExpression += digit;

  updateDisplay();
  updateExpressionDisplay();
}
function inputDecimal() {
  if (calculator.waitingForSecondOperand) {
    calculator.displayValue = "0.";
    calculator.waitingForSecondOperand = false;
  } else if (!calculator.displayValue.includes(".")) {
    calculator.displayValue += ".";
  }
  calculator.currentExpression += ".";
  updateDisplay();
  updateExpressionDisplay();
}
function handleOperator(nextOperator) {
  if (nextOperator === "open-paren" || nextOperator === "close-paren") {
    let expr = calculator.currentExpression;
    if (nextOperator === "open-paren") {
      if (expr && /[\d)]$/.test(expr)) {
        expr += "*";
      }
      expr += "(";
    } else {
      expr += ")";
    }
    calculator.currentExpression = expr;
    updateExpressionDisplay();
    return;
  }
  if (nextOperator === "equals") {
    try {
      let result;

      if (calculator.operator && calculator.secondOperand != null) {
        result = eval(
          `${calculator.firstOperand} ${calculator.operator} ${calculator.secondOperand}`
        );
        calculator.lastOperator = calculator.operator;
        calculator.lastOperand = calculator.secondOperand;
        addToHistory(
          `${calculator.firstOperand} ${calculator.operator} ${calculator.secondOperand}`,
          result
        );
        calculator.currentExpression = `${calculator.firstOperand} ${calculator.operator} ${calculator.secondOperand} =`;
      } else if (calculator.lastOperator && calculator.lastOperand != null) {
        result = eval(
          `${calculator.displayValue} ${calculator.lastOperator} ${calculator.lastOperand}`
        );
        addToHistory(
          `${calculator.displayValue} ${calculator.lastOperator} ${calculator.lastOperand}`,
          result
        );
        calculator.currentExpression = `${calculator.displayValue} ${calculator.lastOperator} ${calculator.lastOperand} =`;
      }
      calculator.displayValue = result;
      calculator.firstOperand = result;
      calculator.waitingForSecondOperand = true;
    } catch (e) {
      calculator.displayValue = "Error";
      calculator.currentExpression = "";
    }
    updateDisplay();
    updateExpressionDisplay();
    calculator.operator = null;
    return;
  }

  const operatorMap = {
    add: "+",
    subtract: "-",
    multiply: "*",
    divide: "/",
    mod: "%",
  };
  const op = operatorMap[nextOperator] || nextOperator;
  if (/[\+\-\*\/]$/.test(calculator.currentExpression)) {
    calculator.currentExpression =
      calculator.currentExpression.slice(0, -1) + op;
  } else {
    calculator.currentExpression += op;
  }
  if (calculator.firstOperand === null) {
    calculator.firstOperand = parseFloat(calculator.displayValue);
  } else if (
    calculator.operator &&
    calculator.secondOperand != null &&
    !calculator.waitingForSecondOperand
  ) {
    const result = eval(
      `${calculator.firstOperand} ${calculator.operator} ${calculator.secondOperand}`
    );
    calculator.displayValue = result;
    calculator.firstOperand = result;
    calculator.secondOperand = null;
    updateDisplay();
  }
  calculator.operator = op;
  calculator.waitingForSecondOperand = true;
  updateExpressionDisplay();
}
const performCalculation = {
  "/": (firstOperand, secondOperand) => {
    if (secondOperand === 0) {
      return "Error";
    }
    return firstOperand / secondOperand;
  },
  "*": (firstOperand, secondOperand) => firstOperand * secondOperand,
  "+": (firstOperand, secondOperand) => firstOperand + secondOperand,
  "-": (firstOperand, secondOperand) => firstOperand - secondOperand,
  "%": (firstOperand, secondOperand) => firstOperand % secondOperand,
  "=": (firstOperand, secondOperand) => secondOperand,
};
function resetCalculator() {
  calculator.displayValue = "0";
  updateDisplay();
  calculator.firstOperand = null;
  calculator.waitingForSecondOperand = false;
  calculator.operator = null;
  calculator.currentExpression = "";

  updateDisplay();
  updateExpressionDisplay();
}
function handleScientificFunction(func) {
  const value = parseFloat(calculator.displayValue);

  if (isNaN(value) && func !== "rand" && func !== "pi") {
    calculator.displayValue = "Error";
    updateDisplay();
    return;
  }
  let result;
  switch (func) {
    case "square":
      result = value * value;
      addToHistory(`sqr(${value})`, result);
      updateDisplay();
      break;
    case "cube":
      result = value * value * value;
      addToHistory(`cube(${value})`, result);
      updateDisplay();
      break;
    case "sqrt":
      if (value < 0) {
        result = "Error";
      } else {
        result = Math.sqrt(value);
      }
      addToHistory(`√(${value})`, result);
      updateDisplay();
      break;
    case "cube-root":
      result = Math.cbrt(value);
      addToHistory(`∛(${value})`, result);
      updateDisplay();
      break;
    case "reciprocal":
      if (value === 0) {
        result = "Error";
      } else {
        result = 1 / value;
      }
      addToHistory(`1/(${value})`, result);
      updateDisplay();
      break;
    case "factorial":
      if (value < 0 || !Number.isInteger(value)) {
        result = "Error";
      } else {
        result = 1;
        for (let i = 2; i <= value; i++) {
          result *= i;
        }
      }
      addToHistory(`(${value}!)`, result);
      updateDisplay();
      break;
    case "power":
      calculator.operator = "power";
      calculator.firstOperand = value;
      calculator.waitingForSecondOperand = true;
      calculator.currentExpression = `${value}^`;
      updateDisplay();
      return;
    case "power10":
      result = Math.pow(10, value);
      addToHistory(`10^(${value})`, result);
      updateDisplay();
      break;
    case "exp":
      result = Math.exp(value);
      addToHistory(`exp(${value})`, result);
      updateDisplay();
      break;
    case "log":
      if (value <= 0) {
        result = "Error";
      } else {
        result = Math.log10(value);
      }
      addToHistory(`log(${value})`, result);
      updateDisplay();
      break;
    case "ln":
      if (value <= 0) {
        result = "Error";
      } else {
        result = Math.log(value);
      }
      addToHistory(`ln(${value})`, result);
      updateDisplay();
      break;
    case "abs":
      result = Math.abs(value);
      addToHistory(`abs(${value})`, result);
      break;
    case "floor":
      result = Math.floor(value);
      addToHistory(`floor(${value})`, result);
      updateDisplay();
      break;
    case "ceil":
      result = Math.ceil(value);
      addToHistory(`ceil(${value})`, result);
      updateDisplay();
      break;
    case "rand":
      result = Math.random();
      addToHistory(`rand()`, result);
      updateDisplay();
      break;
    case "pi":
      result = Math.PI;
      addToHistory(`π`, result);
      updateDisplay();
      break;
    case "percent":
      result = value / 100;
      addToHistory(`(${value})%`, result);
      updateDisplay();
      break;
    case "plus-minus":
      result = -value;
      calculator.displayValue = result.toString();
      updateDisplay();
      return;
    case "sin":
      result = calculator.isDegMode
        ? Math.sin((value * Math.PI) / 180)
        : Math.sin(value);
      addToHistory(`sin(${value}${calculator.isDegMode ? "°" : ""})`, result);
      updateDisplay();
      break;
    case "cos":
      result = calculator.isDegMode
        ? Math.cos((value * Math.PI) / 180)
        : Math.cos(value);
      addToHistory(`cos(${value}${calculator.isDegMode ? "°" : ""})`, result);
      updateDisplay();
      break;
    case "tan":
      result = calculator.isDegMode
        ? Math.tan((value * Math.PI) / 180)
        : Math.tan(value);
      addToHistory(`tan(${value}${calculator.isDegMode ? "°" : ""})`, result);
      updateDisplay();
      break;
    case "dms":
      {
        const decimal = parseFloat(calculator.displayValue);
        if (isNaN(decimal)) {
          calculator.displayValue = "Error";
          updateDisplay();
          break;
        }
        const deg = Math.floor(decimal);
        const minutesDecimal = (decimal - deg) * 60;
        const minutes = Math.floor(minutesDecimal);
        const seconds = ((minutesDecimal - minutes) * 60).toFixed(2);
        calculator.displayValue = `${deg}°${minutes}'${seconds}"`;
        addToHistory(`${decimal}° in DMS`, calculator.displayValue);
        updateDisplay();
      }
      break;
    case "deg":
      {
        const dmsString = calculator.displayValue;
        const match = dmsString.match(/(\d+)°(\d+)'([\d.]+)"/);
        if (!match) {
          break;
        }
        const degrees = parseFloat(match[1]);
        const minutes = parseFloat(match[2]);
        const seconds = parseFloat(match[3]);
        const decimal = degrees + minutes / 60 + seconds / 3600;
        calculator.displayValue = decimal.toString();
        addToHistory(
          `${degrees}°${minutes}'${seconds}" in Decimal`,
          calculator.displayValue
        );
        updateDisplay();
      }
      break;
    case "cube":
      result = value * value * value;
      addToHistory(`cube(${value})`, result);
      break;

    case "cube-root":
      result = Math.cbrt(value);
      addToHistory(`∛(${value})`, result);
      break;

    case "power2":
      result = Math.pow(2, value);
      addToHistory(`2^(${value})`, result);
      break;

    case "logy":
      if (calculator.firstOperand === null) {
        calculator.firstOperand = value;
        calculator.operator = "logy";
        calculator.waitingForSecondOperand = true;
        calculator.currentExpression = `logᵧ(${value}, `;
        updateExpressionDisplay();
        return;
      } else {
        const base = calculator.firstOperand;
        if (base <= 0 || base === 1 || value <= 0) {
          result = "Error";
        } else {
          result = Math.log(value) / Math.log(base);
        }
        addToHistory(`log base ${base} (${value})`, result);
        calculator.firstOperand = null;
      }
      break;

    case "y-root":
      if (calculator.firstOperand === null) {
        calculator.firstOperand = value;
        calculator.operator = "y-root";
        calculator.waitingForSecondOperand = true;
        calculator.currentExpression = `${value}√(`;
        updateExpressionDisplay();
        return;
      } else {
        const degree = calculator.firstOperand;
        if (degree === 0) {
          result = "Error";
        } else {
          result = Math.pow(value, 1 / degree);
        }
        addToHistory(`${degree}√(${value})`, result);
        calculator.firstOperand = null;
      }
      break;
    case "e-power":
      result = Math.exp(value);
      addToHistory(`e^(${value})`, result);
      break;

    default:
      return;
  }
  calculator.displayValue = result.toString();
  updateDisplay();
}
function toggleSecondMode() {
  calculator.isSecondMode = !calculator.isSecondMode;
  secondBtn.classList.toggle("active");
  document.querySelectorAll(".toggle-func").forEach((btn) => {
    if (calculator.isSecondMode) {
      btn.textContent = getLabel(btn.dataset.secondaryAction);
      btn.dataset.action = btn.dataset.secondaryAction;
    } else {
      btn.textContent = getLabel(btn.dataset.primaryAction);
      btn.dataset.action = btn.dataset.primaryAction;
    }
  });
}
function getLabel(action) {
  const labels = {
    square: "x²",
    cube: "x³",
    sqrt: "²√x",
    "cube-root": "∛x",
    reciprocal: "1/x",
    "y-root": "ʸ√x",
    abs: "|x|",
    exp: "exp",
    power2: "2ˣ",
    mod: "mod",
    power: "xⁿ",
    "power-e": "eⁿ",
    power10: "10ˣ",
    logy: "logᵧx",
    log: "log",
    ln: "ln",
    "e-power": "eˣ",
  };
  return labels[action] || action;
}
function toggleDegRadMode() {
  calculator.isDegMode = !calculator.isDegMode;
  degRadBtn.textContent = calculator.isDegMode ? "DEG" : "RAD";
  degRadBtn.classList.toggle("active");
}
function toggleFEMode() {
  calculator.isFEMode = !calculator.isFEMode;
  feBtn.classList.toggle("active");
  updateDisplay();
}
function addButtonClickEffect(button) {
  button.style.transform = "translateY(0)";
  button.style.boxShadow = "0 1px 2px rgba(0, 0, 0, 0.1)";
  setTimeout(() => {
    button.style.transform = "";
    button.style.boxShadow = "";
  }, 150);
}
document.querySelectorAll("button").forEach((button) => {
  button.addEventListener("click", () => {
    addButtonClickEffect(button);
    if (button.dataset.number) {
      inputDigit(button.dataset.number);
    } else if (button.dataset.action) {
      const action = button.dataset.action;

      if (action === "decimal") {
        inputDecimal();
      } else if (action === "clear") {
        resetCalculator();
      } else if (
        ["add", "subtract", "multiply", "divide", "mod", "equals"].includes(
          action
        )
      ) {
        handleOperator(action);
      } else if (action === "open-paren" || action === "close-paren") {
        handleOperator(action);
      } else if (["mc", "m-plus", "m-minus", "ms", "m"].includes(action)) {
        handleMemoryFunction(action);
      } else if (action === "second") {
        toggleSecondMode();
      } else {
        handleScientificFunction(action);
      }
    }
  });
});
degRadBtn.addEventListener("click", toggleDegRadMode);
feBtn.addEventListener("click", toggleFEMode);
clearHistoryBtn.addEventListener("click", () => {
  calculator.history = [];
  historyList.innerHTML =
    '<div class="empty-history">No calculations yet</div>';
});
document.addEventListener("keydown", (event) => {
  const key = event.key;
  if (/[0-9]/.test(key)) {
    inputDigit(key);
    const button = document.querySelector(`button[data-number="${key}"]`);
    if (button) addButtonClickEffect(button);
  } else if (key === ".") {
    inputDecimal();
    const button = document.querySelector('button[data-action="decimal"]');
    if (button) addButtonClickEffect(button);
  } else if (["+", "-", "*", "/"].includes(key)) {
    handleOperator(key === "*" ? "multiply" : key === "/" ? "divide" : key);
    const button = document.querySelector(
      `button[data-action="${
        key === "*" ? "multiply" : key === "/" ? "divide" : key
      }"]`
    );
    if (button) addButtonClickEffect(button);
  } else if (key === "Enter" || key === "=") {
    handleOperator("equals");
    const button = document.querySelector('button[data-action="equals"]');
    if (button) addButtonClickEffect(button);
  } else if (key === "Escape" || key === "c" || key === "C") {
    resetCalculator();
    const button = document.querySelector('button[data-action="clear"]');
    if (button) addButtonClickEffect(button);
  } else if (key === "Backspace") {
    calculator.displayValue = calculator.displayValue.slice(0, -1) || "0";
    updateDisplay();
  }
});
updateDisplay();
