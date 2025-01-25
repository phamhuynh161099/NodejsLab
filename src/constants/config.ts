import argv from 'minimist'

//! Lấy các giá trị từ CML để sử dụng
/**
 * npm run dev --production
 */
const options = argv(process.argv.slice(2));
console.log('options',options)

export const isPorduction = Boolean(options.production)