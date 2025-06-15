/*
 * Copyright (C) 2025 SchoolNest
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */
import React from "react";

const JavaBeginnerGuide = () => {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold text-center">🚀 Beginner Guide to CS, Linux & Java</h1>

      <section>
        <h2 className="text-xl font-semibold">🧠 What is CS?</h2>
        <p>CS stands for <strong>Computer Science</strong>. It’s the study of how computers follow instructions (called code) to solve problems and perform tasks.</p>
      </section>

      <section>
        <h2 className="text-xl font-semibold">☕ What is Java?</h2>
        <p>Java is a programming language used to build apps, games, and tools. To write and run Java code, you need the <strong>Java Development Kit (JDK)</strong>.</p>
        <p>In your setup, Java 17 is run by prefixing commands with <code>j17</code>.</p>
      </section>

      <section>
        <h2 className="text-xl font-semibold">🖥️ First Java Program (Hello World)</h2>
        <pre className="p-4 overflow-x-auto text-sm">
          <code>
{`public class HelloWorld {
    public static void main(String[] args) {
        System.out.println("Hello, world!");
    }
}`}
          </code>
        </pre>
      </section>

      <section>
        <h2 className="text-xl font-semibold">🐧 Useful Linux Commands</h2>
        <ul className="list-disc ml-6 space-y-2">
          <li>
            <code>cd</code> — change directory (e.g. <code>cd Documents</code>)
          </li>
          <li>
            <code>mkdir</code> — make new folder (e.g. <code>mkdir JavaProjects</code>)
          </li>
          <li>
            <code>touch</code> — create empty file (e.g. <code>touch HelloWorld.java</code>)
          </li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-semibold">🔄 Full Workflow Example</h2>
        <pre className="p-4 overflow-x-auto text-sm">
          <code>
{`mkdir JavaProjects
cd JavaProjects
touch HelloWorld.java
nano HelloWorld.java  # Paste the HelloWorld code here
j17 javac HelloWorld.java
j17 java HelloWorld`}
          </code>
        </pre>
      </section>

      <section>
        <h2 className="text-xl font-semibold">📝 Summary Table</h2>
        <ul className="space-y-2 mt-2">
          {[
            ["cd", "Change directory", "cd Documents"],
            ["cd ..", "Go up one folder", "cd .."],
            ["mkdir", "Make new folder", "mkdir JavaProjects"],
            ["touch", "Create new file", "touch HelloWorld.java"],
            ["nano", "Edit file in terminal", "nano HelloWorld.java"],
            ["j17 javac", "Compile Java code", "j17_optimized HelloWorld.java"],
            ["j17 java", "Run Java program", "j17 java HelloWorld"],
          ].map(([cmd, desc, example], i) => (
            <li key={i}>
              <strong><code>{cmd}</code></strong>: {desc} — <code>{example}</code>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
};

export default JavaBeginnerGuide;
