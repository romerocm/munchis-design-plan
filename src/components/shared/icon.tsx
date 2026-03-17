/*
  Hugeicons stroke-rounded icon component.
  Icons are stored as SVGs in /public/icons/ and loaded as <img> tags.

  Usage:
    <Icon name="arrow-right-01" size={16} />
    <Icon name="instagram" size={20} className="opacity-50" />

  Available icons:
    arrow-right-01, arrow-left-01, arrow-down-01,
    star, clock-01, checkmark-circle-02,
    link-square-01, share-08, home-01,
    clipboard, calendar-03, logout-01,
    pencil-edit-02, add-01, minus-sign, plus-sign,
    location-01, instagram, youtube, tiktok, whatsapp
*/

interface IconProps {
  name: string;
  size?: number;
  className?: string;
  alt?: string;
}

export function Icon({ name, size = 24, className = "", alt }: IconProps) {
  return (
    <img
      src={`/icons/${name}.svg`}
      width={size}
      height={size}
      alt={alt || name}
      className={className}
      style={{ width: size, height: size }}
    />
  );
}
