// --------------------
// Types
// --------------------

export type UnformattedError = {
  code?: string;
  message?: string;
  details?: string;
  hint?: string;
  [key: string]: unknown;
}

export type ErrorType = {
  code: string;
  message: string;
  details: string;
  hint: string;
}

export type DataErrorReturnObject<T> = {
  data: T | null;
  error: ErrorType | null;
}

export type ErrorsObject = {
  internalServerError: ErrorType;
  invalidCredentials: ErrorType;
  badOAuthCallback: ErrorType;
  userNotFound: ErrorType;
  userAlreadyExists: ErrorType;
  missingPassword: ErrorType;
  weakPassword: ErrorType;
  sessionNotFound: ErrorType;
  missingInputs: ErrorType;
  accessDenied: ErrorType;
  databaseError: ErrorType;
  cacheError: ErrorType;
  unknownError: ErrorType;
  referenceError: ErrorType;
  typeError: ErrorType;
  syntaxError: ErrorType;
  [key: string]: ErrorType;
}

// --------------------
// Errors
// --------------------

export const errors: ErrorsObject = {
  internalServerError: {
    code: 'internal_server_error',
    message: 'Internal Server Error',
    details: 'We are sorry, something went wrong',
    hint: 'Try again later'
  },
  invalidCredentials: {
    code: 'invalid_credentials',
    message: 'Invalid login credentials',
    details: 'The email or password is incorrect',
    hint: 'Double-check your email and password and try again'
  },
  badOAuthCallback: {
    code: 'bad_oauth_callback',
    message: 'Bad OAuth Callback',
    details: 'The email or password is incorrect',
    hint: 'Double-check your email and password and try again'
  },
  userNotFound: {
    code: 'user_not_found',
    message: 'User not found',
    details: 'No user exists with the provided credentials',
    hint: 'Check that the user has signed up'
  },
  userAlreadyExists: {
    code: 'user_already_exists',
    message: 'User already registered',
    details: 'A user already exists with this email address',
    hint: 'Use sign-in instead of sign-up'
  },
  missingPassword: {
    code: 'missing_password',
    message: 'Password required',
    details: 'A password is required to sign up',
    hint: 'Ensure a valid password is provided'
  },
  weakPassword: {
    code: 'weak_password',
    message: 'Weak Password',
    details: 'The password is too weak',
    hint: 'Try a stronger password'
  },
  sessionNotFound: {
    code: 'session_not_found',
    message: 'Session Not Found',
    details: 'Session to which the API request relates has expired.',
    hint: 'Try logging back in'
  },
  missingInputs: {
    code: 'missing_inputs',
    message: 'Missing Inputs',
    details: 'Required inputs are missing',
    hint: 'Check that all require inputs are passed in to the function'
  },
  accessDenied: {
    code: 'access_denied',
    message: '401 Access Denied',
    details: 'Access denied',
    hint: 'Make sure you are using the proper API key or authentication if you are authorized, or stop trying to hack our API if you are not'
  },
  databaseError: {
    code: 'database_error',
    message: 'Database Error',
    details: 'Something has gone wrong with the database',
    hint: 'Check database logs or try again'
  },
  cacheError: {
    code: 'cache_error',
    message: 'Cache error',
    details: 'Something has gone wrong with the cache',
    hint: 'Check cache logs or try again'
  },
  unknownError: {
    code: 'unknown_error',
    message: 'Custom error of unknown type',
    details: 'Custom error of unknown type',
    hint: 'No hint available, as this error is custom or unknown'
  },
  referenceError: {
    code: 'reference_error',
    message: 'Reference error',
    details: 'A nonexistent variable or variable outside the current scope was referenced',
    hint: 'Log the variable that may have caused this error or check your input variables'
  },
  typeError: {
    code: 'type_error',
    message: 'Type error',
    details: 'A value is not of the expected type or used in an incompatible way',
    hint: 'Check the function this error was thrown and make sure all variables are being used properly.'
  },
  syntaxErrror: {
    code: 'syntax_error',
    message: 'Syntax error',
    details: 'There is a syntax error',
    hint: 'Check the syntax.'
  }
};

// --------------------
// Internal helper functions
// --------------------

const sleep = (ms: number) => {
  return new Promise (resolve => setTimeout(resolve, ms));
}

/**
 * @Function logError
 *
 * A wrapper around console.error that provides more readable error logging.  It takes in an error of either the ErrorType type or unknown and a location string written manually by the developer that shows the exact function the error occurred in.  This wrapper is necessary because some errors do not show a readable stack trace, and by allowing the user to pass in a trace string showing the exact function the error occurred in, making debugging easier.  This is especially useful if a catch block is hit, because an error from a catch block can come in in a variety of formats.  The function first logs a "summary", showing a shortened version of the error (error code: error message if a typed error, or the first 15 characters if an untyped error and the function the error was hit in) and then console.errors the error message in full.  To be used in all development in place of console.error alone.
 *
 * @param {ErrorType | unknown} error // the error, which can either be in the typed ErrorType format or an unknown format
 * @param {string} location // a string inputted by the developer showing the exact function the error was hit in
 *
 * @returns {void}
 *
 * @example
 const getCitiesFromAPI () => {
  try {
    const response = await getAllCities();
    res.status(200).send({ data: response, error: null });
  } catch (error) {
    logError(error, 'getCitiesFromAPI');
    const formattedError = formatError(error);
    res.status(500).json({ data: null, error: formattedError });
  }
 }
 */

const logError = (error: ErrorType | unknown, location: string) => {
  const typedError = error as ErrorType;
  const code = typedError.code ? typedError.code : errors.unknownError.code;
  const message = typedError.message ? typedError.message : errors.unknownError.message;

  // log a short version of the input error specified to be at the input location, then log the input error in full
  const summaryErrorMessage = code === 'unknown_error' ? JSON.stringify(error).slice(0, 15) : `${code}: ${message}`;
  console.log(`${summaryErrorMessage} at ${location}`);
  console.error(error);
}

/**
 * @Function formatError
 *
 * Converts an error of any type into a typed error object used by dataerror with code, message, description, and hint fields.  Will return an error already typed as such as is (basically a no-op).  Will check to see if the error is a ReferenceError or TypeError and will return the appopriate dataerror formatted error objects for each.  If the error is completely unknown, errors.unknownError will be returned.
 *
 * @param {unknown} error // the error, which can either be in the typed ErrorType format or an unknown format
 *
 * @returns {ErrorType}
 *
 * @example
 const getCitiesFromAPI () => {
  try {
    const response = await getAllCities();
    res.status(200).send({ data: response, error: null });
  } catch (error) {
    logError(error, 'getCitiesFromAPI');
    const formattedError = formatError(error);
    res.status(500).json({ data: null, error: formattedError });
  }
 }
 */

const formatError = (error: unknown): ErrorType => {
  if (error instanceof ReferenceError) {
    return errors.referenceError;
  }

  if (error instanceof TypeError) {
    return errors.typeError;
  }

  const typedError = error as UnformattedError;

  if (typedError.code && typedError.message && typedError.details && typedError.hint) {
    return error as ErrorType;
  }

  return {
    code: typedError.code ? typedError.code : errors.unknownError.code,
    message: typedError.message ? typedError.message : errors.unknownError.message,
    details: typedError.details ? typedError.details : errors.unknownError.details,
    hint: typedError.hint ? typedError.hint : errors.unknownError.hint
  }
}

// --------------------
// User-facing functions
// --------------------
//

// there is currently not much reason for these functions to be async other than future-proofing... we may want to add async functionality such as logging to an error service like Posthog later so it's easier to just make these functions async from the outset than tell users later "oh hey these functions are async now"

/**
 * @Function success
 *
 * The success function of dataerror, to be used when there are no errors and you want to return the data - it is basically a type-safe named wrapper around ```return { data, error: null }```.  Requires a generic type T to be passed in.  Takes in data of specified type T and returns a Promise<DataErrorReturnObject> in the following format: { data: T, error: null }
 *
 * This is an async function for future-proofing purposes and returns a Promise.
 *
 * @param {T} data // the data to be returned in the data field, specified as generic type T
 *
 * @returns {Promise<DataErrorReturnObject<T>>}
 *
 * @example
 const getJSONPlaceholderData (route: string) => {
  try {
    const response = await fetch(`https://jsonplaceholder.typicode.com/${route}`);
    return await success<JSONPLaceholderData>(response);
  } catch (error) {
    return failure(error, 'apiFunctions/getJSONPlaceholderData')
  }
 }
 */
export async function success<T>(data: T): Promise<DataErrorReturnObject<T>> {
  return {
    data,
    error: null
  } as DataErrorReturnObject<T>;
}

export type ErrorAdditionalArgs = {
  returnErrorType?: ErrorType;
  logInvalidCredentialsErrors?: boolean;
}

/**
 * @Function failure
 *
 * The failure function of dataerror, to be used whenever an error is returned within the function or a catch block is hit.  Still requires a generic type T to be passed in as the DataErrorReturnObject type expects a generic type T as well.  Uses @logError and @formatError under the hood.  Takes in an error of ErrorType or unknown format, a "location" string showing the function the error occurred in, and additional optional arguments.  Logs the error and formats it to a dataerror ErrorType, then returns a Promise<DataErrorReturnObject<T>> in the following format: { data: null, error: ErrorType }.
 *
 * This is an async function for future-proofing purposes and returns a Promise.
 *
 * @param {ErrorType | unknown} error // the error generated by the function or catch block.  Can be a typed dataerror error object or unknown - this does not matter as it will be formatted using @formatError in this function
 * @param {string} location // the function the error was hit in (e.g. 'auth/actions/getCurrentUser')
 * @param {ErrorAdditionalArgs} additionalArgs // some optional additional arguments
 * returnErrorType (ErrorType): for when the developer wants to force the returned error type to a specific type (e.g. errors.databaseError if the error is within a database function)
 * logInvalidCredentialsErrors (boolean): allows the developer to specify desire to log invalid credentials errors - the developer may not want to do this because it means errors are logged every time an end user logs in with invalid credentials which could overload error logs
 *
 * @returns {Promise<DataErrorReturnObject<T>>}
 *
 * @example
 const getJSONPlaceholderData (route: string) => {
  try {
    const response = await fetch(`https://jsonplaceholder.typicode.com/${route}`);
    return await success<JSONPLaceholderData>(response);
  } catch (error) {
    return failure(error, 'apiFunctions/getJSONPlaceholderData')
  }
 }
 */
export async function failure<T>(error: unknown, location: string, additionalArgs?: ErrorAdditionalArgs): Promise<DataErrorReturnObject<T>> {
  const formattedError = formatError(error);

  if (formattedError.code === errors.invalidCredentials.code) {
    if (additionalArgs && additionalArgs.logInvalidCredentialsErrors) {
      logError(error, location);
    }
  } else {
    logError(error, location);
  }

  // this is an optional argument that forces this function to return a specific error type - for example, we want it to return errors.databaseError in a situation where the error is almost certainly a database error but it may come back as an unknown error
  if (additionalArgs && additionalArgs.returnErrorType) {
    return {
      data: null,
      error: additionalArgs.returnErrorType
    } as DataErrorReturnObject<T>;
  }

  return {
    data: null,
    error: formattedError
  } as DataErrorReturnObject<T>;
}
