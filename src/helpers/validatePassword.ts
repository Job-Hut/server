function validatePassword(password: string) {
    const minLength = 8;
    const lengthRequirement = password.length >= minLength;
    const uppercaseRequirement = /[A-Z]/.test(password);
    const numberRequirement = /[0-9]/.test(password);
  
    if (!lengthRequirement) {
      throw new Error(`Password must be at least ${minLength} characters long.`);
    }
    if (!uppercaseRequirement) {
      throw new Error("Password must contain at least one uppercase letter.");
    }
    if (!numberRequirement) {
      throw new Error("Password must contain at least one number.");
    }
  
    return true;
}
  
export default validatePassword