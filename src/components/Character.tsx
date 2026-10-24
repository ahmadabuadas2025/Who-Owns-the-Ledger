/** Transparent-background mascot SVGs served from /public/characters. */
export const CHARACTERS = {
  'kimono-boy': 'Boy in a blue kimono',
  'sunny-adventurer': 'Cheerful adventurer in a woven sun hat',
  'red-gi-fighter': 'Martial artist in a red gi with a topknot',
  'trail-explorer': 'Waving explorer in a mustard jacket',
  'scarf-ninja': 'Ninja with a red scarf giving a thumbs up',
} as const

export type CharacterName = keyof typeof CHARACTERS

export function Character({
  name,
  className = 'h-48 w-auto',
  alt = CHARACTERS[name],
}: {
  name: CharacterName
  className?: string
  alt?: string
}) {
  return (
    <img
      src={`${import.meta.env.BASE_URL}characters/${name}.svg`}
      alt={alt}
      className={className}
      draggable={false}
    />
  )
}
