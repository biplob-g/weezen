import React from "react";
import SignUpFormProvider from "@/components/forms/SignUp/formProvider";
import RegistrationFormStep from "@/components/forms/SignUp/registrationStep";
import ButtonHandler from "@/components/forms/SignUp/buttonHandler";
import HighlightBar from "@/components/forms/SignUp/highlightsBar";

const SignUp = () => {
  return (
    <div className="flex-1 py-35 md:px-16 w-full">
      <div className="flex flex-col h-full gap-2">
        <SignUpFormProvider>
          <div className="flex flex-col gap-3">
            <RegistrationFormStep />
            <ButtonHandler />
            <HighlightBar />
          </div>
        </SignUpFormProvider>
      </div>
    </div>
  );
};

export default SignUp;
