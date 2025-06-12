// components/PackageManager.tsx
import React, { useState } from 'react';
import { Terminal, Loader, Trash2, Check } from 'lucide-react';

interface PackageManagerProps {
  pyodideLoaded: boolean;
  installPackage: (packageName: string) => Promise<void>;
  uninstallPackage: (packageName: string) => void;
  installedPackages: string[];
}

const commonPackages = [
  'numpy', 'matplotlib', 'pandas', 'scipy', 'scikit-learn',
  'micropip', 'pytz', 'packaging', 'pillow', 'requests'
];

export const PackageManager: React.FC<PackageManagerProps> = ({
  pyodideLoaded,
  installPackage,
  uninstallPackage,
  installedPackages,
}) => {
  const [packageInput, setPackageInput] = useState('');
  const [isInstalling, setIsInstalling] = useState(false);
  const [showPackageManager, setShowPackageManager] = useState(false);
  const [showInstalled, setShowInstalled] = useState(true);

  const handlePackageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!packageInput.trim()) return;

    setIsInstalling(true);
    try {
      await installPackage(packageInput);
      setPackageInput('');
    } finally {
      setIsInstalling(false);
    }
  };

  return (
    <div className="mt-4 pt-4 border-t border-gray-700 px-4 pb-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-gray-300">Packages</h3>
        <button
          onClick={() => setShowPackageManager(!showPackageManager)}
          className="text-xs flex items-center gap-1 bg-neutral-800 hover:bg-neutral-700 px-2 py-1 rounded text-neutral-300 border border-neutral-700"
        >
          <Terminal className="h-3 w-3" />
          {showPackageManager ? 'Hide' : 'Show'}
        </button>
      </div>

      {showPackageManager ? (
        <div className="space-y-3">
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={packageInput}
              onChange={(e) => setPackageInput(e.target.value)}
              placeholder="Package name"
              className="flex-1 bg-neutral-800 border border-neutral-700 rounded px-2 py-1 text-sm text-white"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handlePackageSubmit(e);
                }
              }}
            />
            <button
              onClick={handlePackageSubmit}
              disabled={!pyodideLoaded || isInstalling || !packageInput.trim()}
              className="px-3 py-1 bg-[#304529] hover:bg-[#4a6741] text-white rounded text-sm disabled:opacity-50"
            >
              {isInstalling ? (
                <Loader className="h-4 w-4 animate-spin mx-auto" />
              ) : 'Install'}
            </button>
          </div>

          <div className="text-xs text-neutral-400 mb-2">Common packages:</div>
          <div className="grid grid-cols-2 gap-2">
            {commonPackages.map(pkg => (
              <button
                key={pkg}
                onClick={() => installPackage(pkg)}
                disabled={!pyodideLoaded || isInstalling || installedPackages.includes(pkg)}
                className={`text-center p-2 text-xs rounded border transition-all duration-200 ${
                  installedPackages.includes(pkg)
                    ? 'bg-neutral-900 border-green-600 text-green-400'
                    : 'bg-neutral-800 border-neutral-700 hover:border-neutral-600 hover:bg-neutral-700'
                }`}
              >
                {pkg}
                {installedPackages.includes(pkg) && (
                  <Check className="h-3 w-3 inline ml-1" />
                )}
              </button>
            ))}
          </div>

          {installedPackages.length > 0 && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs text-neutral-400">Installed packages:</div>
                <button
                  onClick={() => setShowInstalled(!showInstalled)}
                  className="text-xs text-neutral-400 hover:text-neutral-300"
                >
                  {showInstalled ? 'Hide' : 'Show'}
                </button>
              </div>
              {showInstalled && (
                <div className="space-y-1">
                  {installedPackages.map(pkg => (
                    <div
                      key={pkg}
                      className="flex items-center justify-between bg-neutral-800 px-3 py-2 rounded border border-neutral-700"
                    >
                      <span className="text-sm">{pkg}</span>
                      <button
                        onClick={() => uninstallPackage(pkg)}
                        className="text-red-500 hover:text-red-400 p-1"
                        title="Uninstall"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {commonPackages.slice(0, 3).map(pkg => (
            <button
              key={pkg}
              onClick={() => installPackage(pkg)}
              disabled={!pyodideLoaded || isInstalling || installedPackages.includes(pkg)}
              className={`text-center p-2 text-xs rounded border transition-all duration-200 ${
                installedPackages.includes(pkg)
                  ? 'bg-neutral-900 border-green-600 text-green-400'
                  : 'bg-neutral-800 border-neutral-700 hover:border-neutral-600 hover:bg-neutral-700'
              }`}
            >
              {pkg}
              {installedPackages.includes(pkg) && (
                <Check className="h-3 w-3 inline ml-1" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};