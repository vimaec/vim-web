/**
 * Ads the behind css class to the vim component div.
 */
export function setComponentBehind (value: boolean) {
  const component = document.getElementsByClassName('vim-component')[0]
  const behind = component.classList.contains('behind')
  if (value && !behind) {
    component.classList.add('behind')
  } else if (!value && behind) {
    component.classList.remove('behind')
  }
}
