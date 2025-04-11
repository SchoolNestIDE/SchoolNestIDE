//// filepath: /c:/Users/agney/Documents/ScheduleApp/frontend/app/(app)/onboarding/page.tsx
"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import HomeHeader from "@/app/components/HomeHeader";
import { Input, Button, Spinner, Autocomplete, AutocompleteItem } from "@nextui-org/react";
import { Label } from "@/app/components/ui/label";
import { useGoogleReCaptcha } from "react-google-recaptcha-v3";
import { useEffect } from "react";

type School = {
  key: string,
  abbr: string,
  name: string,
  address: string
}

export default function OnboardingPage() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const { executeRecaptcha } = useGoogleReCaptcha();

  const [userType, setUserType] = useState<"student" | "educator" | null>(null);
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstname: session?.user?.name?.split(" ")[0] || "",
    lastname: session?.user?.name?.split(" ")[1] || "",
    age: "",
    grade: "",
    job: "",
    schoolname: "",
    school_abbr: "",
  });

  useEffect(() => {
    // Fetch schools list for the dropdown
    const getSchools = async () => {
      const response = await fetch('/api/get_schools/post', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      setSchools(data.schools);
    };

    getSchools();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!executeRecaptcha) {
      console.log("reCAPTCHA not ready");
      setLoading(false);
      return;
    }

    try {
      const gRecaptchaToken = await executeRecaptcha("onboarding");

      // Process the school selection
      const schoolSelection = formData.schoolname;
      const schoolAbbr = schoolSelection.split(":")[0].trim().toLowerCase();

      const payload = {
        ...formData,
        email: session?.user?.email,
        school_abbr: schoolAbbr,
        role: userType,
        gRecaptchaToken,
      };

      const response = await fetch("/api/complete_onboarding/post", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        // Update the session with the new user data
        await update({
          ...session,
          user: {
            ...session?.user,
            role: userType,
            school_abbr: schoolAbbr,
            isNewUser: false,
          }
        });

        // Redirect based on user type
        if (userType === "student") {
          router.push(`/${schoolAbbr}`);
        } else if (userType === "educator") {
          router.push(`/${schoolAbbr}`);
        }
      } else {
        const error = await response.json();
        alert(error.message || "An error occurred during onboarding");
      }
    } catch (error) {
      console.error("Onboarding error:", error);
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <HomeHeader />
      <div className="flex flex-col min-h-screen w-full pb-8 justify-center bg-slate-100 dark:bg-neutral-950">
        <div className="max-w-md w-full mx-auto rounded-2xl p-8 shadow-input bg-white dark:bg-black">
          <h2 className="font-bold text-xl text-neutral-800 dark:text-neutral-200">
            Complete Your Profile
          </h2>
          <p className="text-neutral-600 text-sm max-w-sm my-4  dark:text-neutral-300">
            Welcome to SchoolNest! Please provide a few more details to complete your account setup.
          </p>
          <p>
            <strong>Due to security reasons, you cannot change your profile settings later. The school you select is the school your email will be permanently linked to.</strong>
          </p>

          {!userType ? (
            <div className="mt-4 space-y-2">
              <h3 className="font-medium text-center mb-4">I am a:</h3>
              <Button
                className="w-full"
                color="primary"
                onClick={() => setUserType("student")}
              >
                Student
              </Button>
              <Button
                className="w-full"
                color="secondary"
                onClick={() => setUserType("educator")}
              >
                Teacher/Educator
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-8 space-y-4">
              <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2">
                <div className="flex flex-col space-y-2 w-full">
                  <Label htmlFor="firstname">First name</Label>
                  <Input
                    id="firstname"
                    value={formData.firstname}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="flex flex-col space-y-2 w-full">
                  <Label htmlFor="lastname">Last name</Label>
                  <Input
                    id="lastname"
                    value={formData.lastname}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              {userType === "student" && (
                <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2">
                  <div className="flex flex-col space-y-2 w-full">
                    <Label htmlFor="age">Age</Label>
                    <Input
                      id="age"
                      type="number"
                      value={formData.age}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="flex flex-col space-y-2 w-full">
                    <Label htmlFor="grade">Grade</Label>
                    <Input
                      id="grade"
                      type="number"
                      value={formData.grade}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
              )}

              {userType === "educator" && (
                <div className="flex flex-col space-y-2 w-full">
                  <Label htmlFor="job">Job Title</Label>
                  <Input
                    id="job"
                    placeholder="e.g. Math Teacher, Principal"
                    value={formData.job}
                    onChange={handleChange}
                    required
                  />
                </div>
              )}

              <div className="flex flex-col space-y-2 w-full">
                <Label htmlFor="schoolname">School</Label>
                <Autocomplete
                  isVirtualized
                  className="w-full text-black dark:text-white"
                  defaultItems={schools}
                  placeholder="Search for a School"
                  id="schoolname"
                  onSelectionChange={(value) => {
                    setFormData(prev => ({
                      ...prev,
                      schoolname: value as string
                    }));
                  }}
                >
                  {(school) => (
                    <AutocompleteItem key={school.abbr} textValue={school.abbr + ": " + school.name}>
                      <div className="flex flex-col my-2">
                        <span className="text-sm text-black dark:text-white">{school.abbr}: {school.name}</span>
                        <span className="text-xs dark:text-default-400 text-default-600">{school.address}</span>
                      </div>
                    </AutocompleteItem>
                  )}
                </Autocomplete>
              </div>

              <Button
                type="submit"
                color="primary"
                className="w-full mt-6"
                disabled={loading}
              >
                {loading ? <Spinner size="sm" /> : "Complete Setup"}
              </Button>

              <p className="text-xs text-center text-gray-500 mt-4">
                By continuing, you agree to our Terms of Service and Privacy Policy.
              </p>
            </form>
          )}
        </div>
      </div>
    </>
  );
}