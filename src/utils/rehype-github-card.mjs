import { h } from 'hastscript'

/**
 * Creates a GitHub Card component from ::github{repo="owner/repo"} directive.
 */
export function GithubCardComponent(properties, children) {
  if (Array.isArray(children) && children.length !== 0)
    return h("div", { class: 'hidden' }, ['Invalid directive.']);

  if (!properties.repo || !properties.repo.includes("/"))
    return h("div", { class: 'hidden' }, 'Invalid repository format.');

  const repo = properties.repo;
  const cardUuid = `GC${Math.random().toString(36).slice(-6)}`;

  const nAvatar = h(`div#${cardUuid}-avatar`, { class: "gc-avatar" });

  const nTitle = h("div", { class: "gc-titlebar" }, [
    h("div", { class: "gc-titlebar-left" }, [
      h("div", { class: "gc-owner" }, [
        nAvatar,
        h("div", { class: "gc-user" }, repo.split("/")[0]),
      ]),
      h("div", { class: "gc-divider" }, "/"),
      h("div", { class: "gc-repo" }, repo.split("/")[1]),
    ]),
  ]);

  const nDescription = h(
    `div#${cardUuid}-description`,
    { class: "gc-description" },
    "Loading..."
  );

  const nStars = h(`div#${cardUuid}-stars`, { class: "gc-stars" }, "0");
  const nForks = h(`div#${cardUuid}-forks`, { class: "gc-forks" }, "0");
  const nLicense = h(`div#${cardUuid}-license`, { class: "gc-license" }, "");

  return h(`a#${cardUuid}-card`, {
    class: "card-github fetch-waiting no-styling",
    href: `https://github.com/${repo}`,
    target: '_blank',
    'data-repo': repo,
    'data-card-id': cardUuid
  }, [
    nTitle,
    nDescription,
    h("div", { class: "gc-infobar" }, [nStars, nForks, nLicense]),
  ]);
}
