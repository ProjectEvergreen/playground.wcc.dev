import type { Page } from '@greenwood/cli';
import wccLogo from '../../assets/wcc-logo.svg?type=raw';
import mobileMenuIcon from '../../assets/tile.svg?type=raw';
import styles from './header.module.css';

function getNavItemsHtml(navItems: Page[], isMobile: boolean, currentRoute: string): string {
  const itemClass = isMobile ? styles.mobileMenuListItem : styles.navBarMenuItem;

  return navItems
    .map((item) => {
      const { route, label } = item;
      const isActiveClass = currentRoute === item.route ? 'class="active"' : '';

      return `
        <li class="${itemClass}">
          <a href="${route}" ${isActiveClass} title="${label}">${label}</a>
        </li>
      `;
    })
    .join('');
}

export default class Header extends HTMLElement {
  currentRoute: string;
  navItems: Page[];

  constructor() {
    super();
    this.currentRoute = '';
    this.navItems = [];
  }

  async connectedCallback() {
    this.currentRoute = '/playground/';
    this.navItems = [{
      id: 'index',
      title: 'Home',
      route: 'http://wcc.dev/',
      label: 'Home',
    }, {
      id: 'docs',
      title: 'Docs',
      route: 'http://wcc.dev/docs/',
      label: 'Docs',
    }, {
      id: 'examples',
      title: 'Examples',
      route: 'http://wcc.dev/examples/',
      label: 'Examples',
    }, {
      id: 'playground',
      title: 'Playground',
      route: '/playground/',
      label: 'Playground',
    }];
    this.render();
  }

  render() {
    const mainNavHtml = getNavItemsHtml(this.navItems, false, this.currentRoute);
    const mobileNavHtml = getNavItemsHtml(this.navItems, true, this.currentRoute);

    return (
      <header class={styles.container}>
        <a href="/" title="WCC Home Page" class={styles.logoLink}>
          {wccLogo}
        </a>

        <div class={styles.navBar}>
          <nav role="navigation" aria-label="Main">
            <ul class={styles.navBarMenu}>{mainNavHtml}</ul>
          </nav>
        </div>

        <div class={styles.badgeContainer}>
          <a class={styles.badge} href="https://github.com/ProjectEvergreen/wcc" target="_blank">
            <img
              src="https://img.shields.io/github/stars/ProjectEvergreen/wcc.svg?style=social&logo=github&label=github"
              alt="WCC GitHub badge"
              width={135}
              class="github-badge"
            />
          </a>
        </div>

        <button
          class={styles.mobileMenuIcon}
          popovertarget="mobile-menu"
          aria-label="Mobile Menu Icon Button"
        >
          {mobileMenuIcon}
        </button>

        <div id="mobile-menu" popover="manual" class={styles.mobileMenuContainer}>
          <div class={styles.mobileMenuBackdrop}>
            <button
              class={styles.mobileMenuCloseButton}
              popovertarget="mobile-menu"
              popovertargetaction="hide"
              aria-label="Mobile Menu Close Button"
            >
              &times;
            </button>

            <nav role="navigation" aria-label="Mobile">
              <ul class={styles.mobileMenuList}>{mobileNavHtml}</ul>
            </nav>
          </div>
        </div>
      </header>
    );
  }
}

customElements.define('wcc-header', Header);
