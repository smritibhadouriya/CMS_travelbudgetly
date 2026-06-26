// Loading UI shown in the panel content area during route transitions.
// The sidebar/header shell stays mounted (rendered by the panel layout).
export default function PanelLoading() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
    </div>
  );
}
