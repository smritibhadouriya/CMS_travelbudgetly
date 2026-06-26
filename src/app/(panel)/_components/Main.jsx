import Sidebar from './Sidebar';
import Header from './Header';

export default function Main({ config = {}, children }) {
  return (
    <div
      className="flex min-h-screen bg-slate-50"
      style={{ backgroundColor: config.background_color }}
    >
      {/* Sidebar - hidden on mobile, visible on lg+ */}
      <div className=" lg:w-60 lg:flex-shrink-0 lg:border-r lg:border-slate-200">
        <Sidebar config={config}  />
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header config={config} />

        <main className="flex-1 overflow-auto p-4 sm:p-6 ">
          {/* Optional: limit max width for better readability on large screens */}
          <div className="mx-auto w-full max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
