export interface RootNavGroupConfig {
  icon?: string;
  iconSvg?: string;
  description?: string;
  color?: string;
}

export interface RootNavConfig {
  /**
   * The icon to use for the root nav trigger and options.
   * Can be any Starlight icon name.
   * @default 'open-book'
   */
  icon?: string;
  /**
   * Raw SVG string to use for the root nav trigger.
   * If provided, this overrides the 'icon' option.
   */
  iconSvg?: string;
  /**
   * The title to show in the trigger when no group is active.
   * @default 'Documentation'
   */
  title?: string;
  /**
   * The description to show in the trigger when no group is active.
   */
  description?: string;
  /**
   * The font family to use for the root nav section.
   */
  fontFamily?: string;
  /**
   * Per-group overrides for the root nav switcher.
   * Key is the sidebar group label.
   */
  groups?: Record<string, RootNavGroupConfig>;
}

export interface StarlightFumadocsConfig {
  /**
   * Configuration for the root navigation switcher.
   */
  rootNav?: RootNavConfig;
}
