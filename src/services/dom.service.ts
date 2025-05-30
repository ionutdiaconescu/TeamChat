export const setElementText = (elem: HTMLElement, text: string): void => {
  if (typeof text === "string" && text.length > 0) {
    elem.textContent = text;
  }
};

export const setElementClasses = (elem: HTMLElement, classes: string): void => {
  if (typeof classes === "string" && classes.length > 0) {
    elem.setAttribute("class", classes.trim());
  }
};
export const configureElement = (
  elem: HTMLElement | null,
  classes: string,
  textContent: string,
  otherAttributes?: Record<string, string>
): void => {
  if (!elem) {
    console.warn("configureElement: element not found or is null");
    return;
  }

  setElementClasses(elem, classes);
  setElementText(elem, textContent);

  elem.style.display = textContent ? "block" : "none";

  if (typeof otherAttributes === "object") {
    Object.entries(otherAttributes).forEach(([key, value]) => {
      elem.setAttribute(key, value);
    });
  }
};
export const createDomElement = (
  tagName: keyof HTMLElementTagNameMap,
  classes: string,
  textContent?: string,
  parentToAttachTo?: HTMLElement,
  children?: HTMLElement[]
): HTMLElement => {
  const createdElement = document.createElement(tagName);

  setElementClasses(createdElement, classes);

  if (typeof textContent === "string" && textContent.length > 0) {
    createdElement.textContent = textContent;
  }

  if (Array.isArray(children)) {
    createdElement.append(...children);
  }

  if (parentToAttachTo instanceof Element) {
    parentToAttachTo.appendChild(createdElement);
  }

  return createdElement;
};

export const createDomElementFromHtmlString = (
  htmlString: string,
  elementToAppend?: HTMLElement
): ChildNode | null => {
  const temporaryDiv = document.createElement("div");
  temporaryDiv.innerHTML = htmlString.trim();

  const firstChild = temporaryDiv.firstChild;

  if (firstChild && elementToAppend) {
    elementToAppend.appendChild(firstChild);
  }

  return firstChild;
};
