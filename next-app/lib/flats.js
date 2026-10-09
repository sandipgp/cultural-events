// Flats run from A101 to A1108: 11 floors, 8 flats per floor.
// Floor 1 flat 1 => "A101", floor 11 flat 8 => "A1108".
export const FLOORS = 11
export const FLATS_PER_FLOOR = 8

export function buildFlatList() {
  const list = []
  for (let floor = 1; floor <= FLOORS; floor++) {
    for (let flat = 1; flat <= FLATS_PER_FLOOR; flat++) {
      list.push(`A${floor}${String(flat).padStart(2, '0')}`)
    }
  }
  return list
}

export const FLAT_LIST = buildFlatList()
