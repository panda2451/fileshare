// 引用basic
// 引用cb
import * as crypto from 'crypto';
import cbFunc from '../cb/cb';
import basic from '../db/basic';
import Query from '../db/query';

export class Admin {
  public static permitFile: (fileId: string) => Promise<boolean>;
  public static rejectFile: (fileId: string) => Promise<boolean>;
  public static getPendingFiles: () => Promise<{}>;
  private _req: any;
  private _res: any;
  constructor(req: any, res: any) {
    this._req = req;
    this._res = res;
  }

  public async getUsers(req: any, res: any) {
    const con = await basic('cloud');
    const result1 = await Query('SELECT COUNT(*) FROM user', con);
    const sum = result1[0]['COUNT(*)']; // 总数据数量
    const pages = Math.ceil(sum / 5);
    const nowPage = Number(req.query.page);
    const start = nowPage * 5;

    const result = await Query(
      'SELECT * FROM user LIMIT ' + start + ',' + 5,
      con,
    );
    con.end();
    res.json({ pages, Res: result });
  }

  public getSites(req: any, res: any) {
    basic('cloud').then((con) => {
      const sql = 'select * from website_statistics';
      con.query(
        sql,
        cbFunc((result: any) => {
          res.json(result);
          con.end();
        }),
      );
    });
  }

  public adminLogin(req: any, res: any) {
    console.log(req.body);
    console.log('---------------------------');
    basic('cloud').then((con) => {
      const sql =
        'SELECT * FROM admin WHERE username = ' + req.body.username + ';';
      con.query(
        sql,
        cbFunc((result: any) => {
          console.log(result);
          if (result[0]) {
            if (result[0].password === req.body.password) {
              req.session.user = req.body.username;
              res.json('ok');
              con.end();
            } else {
              res.json('password none');
            }
          } else {
            res.json('username none');
          }
        }),
      );
    });
  }

  public async deleUser(req: any, res: any) {
    const con = await basic('cloud');
    const sql = 'delete from user where id =' + req.body.id;
    await Query(sql, con);
    con.end();
    res.json('ok');
  }

  public async resetPwd(req: any, res: any) {
    const con = await basic('cloud');
    // 这里将000000转为hash
    const hash = crypto.createHash('sha256');
    hash.update('000000');
    const hashed = hash.digest('hex');
    const sql =
      'update user set password = \'' + hashed + '\' where id = ' + req.body.id;
    await Query(sql, con);
    con.end();
    res.json('ok');
  }
  public async searchUser(req: any, res: any) {
    const con = await basic('cloud');
    const sql = 'select * from user where username = \'' + req.params.name + '\'';
    const searchResult = await Query(sql, con);
    if (searchResult.length) {
      con.end();
      res.json(searchResult);
      return;
    }
    con.end();
    res.json('none');
  }
}

Admin.permitFile = async function permitFile(fileId: string): Promise<boolean> {
  const con = await basic('cloud');
  const sql = `select * from pending_file where id=${fileId}`;
  const result = await Query(sql, con);
  if (result.length) {
    const delSql = `delete from pending_file where id=${fileId}`;
    await Query(delSql, con);
    const addSql = `insert into file(id,filename,type,size,downloads,hash) values(${
      result[0].id
    },'${result[0].filename}','${result[0].type}',${result[0].size},${0},'${
      result[0].hash
    }')`;
    await Query(addSql, con);
    return true;
  } else {
    return false;
  }
};

Admin.rejectFile = async function permitFile(fileId: string): Promise<boolean> {
  const con = await basic('cloud');
  const sql = `select * from pending_file where id=${fileId}`;
  const result = await Query(sql, con);
  if (result.length) {
    const delSql = `delete from pending_file where id=${fileId}`;
    await Query(delSql, con);
    return true;
  } else {
    return false;
  }
};

Admin.getPendingFiles = async function getPermitFiles(): Promise<{}> {
  const con = await basic('cloud');
  const sql = `select * from pending_file`;
  const result = await Query(sql, con);
  return result;
};
