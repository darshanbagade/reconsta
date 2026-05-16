import { parse } from 'csv-parse/sync'
import ApiError from './ApiError.js'

// buffer comes from the multer (which it storeed into server RAM)
// when work is done it get reomved

const parseCsvBuffer = (buffer) => {
    try {
        const csvText = buffer.toString('utf-8')

        return parse(csvText, {
            columns: true, //consider first row as header
            skip_empty_lines: true,
            trim: true
        })
    } catch (error) {
        throw new ApiError(400, `Invalid CSV format: ${error.message}`)
    }
}

export default parseCsvBuffer

// Converts uploaded CSV buffer into readable text
// → Multer gives the uploaded file as buffer.
// → csv-parse needs text, so we convert buffer to UTF-8 string.

// columns: true
// → Treats the first CSV row as column names.
// → Returns each row as a JavaScript object.

// skip_empty_lines: true
// → Ignores blank rows in the CSV file.

// trim: true
// → Removes extra spaces from CSV values.