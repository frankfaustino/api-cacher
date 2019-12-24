import { NextFunction, Request, Response } from 'express'

export function formatDate(epoch: number) {
  const date = new Date(epoch * 1000)

  function pad(number: number) {
    return number < 10 ? '0' + number : number
  }

  return `"${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())} ${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())}"`
}

export function catchError(fn?: any) {
  return (req?: Request, res?: Response, next?: NextFunction) => fn(req, res, next).catch(next)
}

interface IError extends Error {
  status: number
}

export function handleError(err: IError, _: Request, res: Response) {
  const errorDetails = {
    message: err.message,
    stack: err.stack || '',
    status: err.status
  }
  return res.status(err.status || 500).json(errorDetails)
}
