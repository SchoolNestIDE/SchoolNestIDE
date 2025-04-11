export default function NotFound() {
  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center">
      <div className="text-center content-center space-y-2">
        <h1 className="text-5xl">404</h1>
        <p>Wrong place! How did you end up here?</p>
        <p className="text-neutral-500">If you can&apos;t tell, we were too lazy to design this page.</p>
        <p className="text-blue-500"><a href="/">Go back</a></p>
      </div>
    </div>
  );
}