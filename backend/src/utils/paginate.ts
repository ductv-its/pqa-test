import { FilterQuery, Model, SortOrder } from 'mongoose';
import { Pagination } from '../interfaces/common.interface';

type PaginateType<T> = {
  model: Model<any, {}, {}, {}, any>;
  filter?: FilterQuery<T>;
  limit?: number;
  page?: number;
  populate?: any[];
  select?: string[];
  sort?: Record<string, SortOrder>;
};

export async function paginate<T>({
  model,
  filter = {},
  limit = 20,
  page = 1,
  populate = [],
  select = [],
  sort = {},
}: PaginateType<T>): Promise<Pagination<T[]>> {
  const offset = (page - 1) * limit;
  let resData = [];

  resData = await Promise.all([
    model
      .find(filter)
      .skip(offset)
      .limit(limit)
      .populate(populate)
      .select(select)
      .sort(sort)
      .lean(),
    model.find(filter).countDocuments(),
  ]);

  return {
    data: resData[0],
    pagination: {
      skip: offset,
      limit: limit,
      total: resData[1],
      current_page: page,
    },
  };
}
