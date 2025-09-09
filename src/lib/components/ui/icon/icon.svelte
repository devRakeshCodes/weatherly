<script>
  import { iconStore } from '$lib/scripts/icon-store';

  let { name, class: className } = $props();

  let iconSvg = iconStore[name] || '';

  function addClassToSvg(svg, className) {
    if (!svg) return '';

    return svg.replace(/<svg([^>]*?)>/, (match, attrs) => {
      // Check if class exists in the original SVG
      if (attrs.includes('class="')) {
        return `<svg${attrs.replace(/class="(.*?)"/, `class="$1 ${className}"`)}>`;
      } else {
        return `<svg${attrs} class="${className}">`;
      }
    });
  }

  let icon = addClassToSvg(iconSvg, className);
</script>

{#if icon}
  {@html icon}
{/if}
