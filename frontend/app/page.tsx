export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6">
      <div className="max-w-2xl text-center">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
          MailThur, connect your inboxes, we handle the rest
        </h1>
        <p className="mt-6 text-lg text-gray-600">
          One place to manage your email workflows without the hassle.
        </p>
        <button
          type="button"
          className="mt-10 rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        >
          Get Started
        </button>
      </div>
    </main>
  );
}
