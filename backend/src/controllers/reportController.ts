import { ManagerFacade } from '../facades/managerFacade';
import { asyncHandler } from '../utils/asyncHandler';
import { sendData } from '../utils/apiResponse';

export class ReportController {
  constructor(private readonly managerFacade: ManagerFacade) {}

  getRevenueSummary = asyncHandler(async (_req, res) => {
    sendData(res, await this.managerFacade.getRevenueSummary());
  });
}
