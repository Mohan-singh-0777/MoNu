const AppLoader = () => {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white">
      <div className="mb-5 flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 text-4xl font-extrabold text-white shadow-2xl animate-pulse">
        M
      </div>

      <h1 className="bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 bg-clip-text text-4xl font-extrabold text-transparent">
        MoNo
      </h1>

      <p className="mt-3 text-sm text-gray-400">Connecting people...</p>
    </div>
  );
};

export default AppLoader;