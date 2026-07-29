import { Store, useStore } from "@tanstack/react-store"

export const profileStore = new Store({
  selectedId: null as string | null,
})

export const useSelectedProfileId = () =>
  useStore(profileStore, (s) => s.selectedId)

export const setSelectedProfile = (id: string | null) =>
  profileStore.setState((s) => ({ ...s, selectedId: id }))
