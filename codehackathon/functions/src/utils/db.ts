import postgres from 'postgres'

const sql = postgres(process.env.POSTGRES_URL!, {
  ssl: 'require',
  max: 5,
})

export default sql
