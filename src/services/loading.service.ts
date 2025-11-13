import { createDomElementFromHtmlString } from './dom.service';

const loadingSpinnerTemplate = (isOpaque: boolean) => `
  <div class="loading-spinner ${isOpaque ? 'opaque' : ''}">
    <img alt="Loading..." src="/loading-spinner.svg" />
  </div>
`;
type ParentElement = HTMLElement | null;

export const renderLoadingSpinner = (
  parentElement: ParentElement,
  isOpaque: boolean = false
): void => {
  if (parentElement) {
    parentElement.classList.add('relative');

    //Check if parent element is null and call the function after.
    const spinner = createDomElementFromHtmlString(
      loadingSpinnerTemplate(isOpaque),
      parentElement
    );
    if (spinner) {
      parentElement.appendChild(spinner);
    }
  }
};

export const removeLoadingSpinner = (parentElement: ParentElement): void => {
  if (parentElement) {
    const spinner = parentElement.querySelector('.loading-spinner');
    if (spinner) spinner.remove();
    parentElement.classList.remove('relative');
  }
};
