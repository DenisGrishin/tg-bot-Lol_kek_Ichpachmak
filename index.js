require('dotenv').config();

const { Bot, GrammyError, HttpError } = require('grammy');
const { getFindUsers, getAllUsers, findUsersBd } = require('./helpers');
const User = require('./db').User;
const bot = new Bot(process.env.BOT_API_KEY);
bot.api.setMyCommands([
  { command: 'set_user', description: 'Добавить пользователей в базу' },
  {
    command: 'edit_enable_user',
    description: 'Активировать пользователей',
  },
  {
    command: 'edit_disabled_user',
    description: 'Деактивировать пользователей',
  },
  {
    command: 'delet_user',
    description: 'Удалить пользователей из базы',
  },
]);

let isSet = false;

let isEdit = false;
let isEnableEdit = false;

let isDelete = false;

bot.command(['set_user'], async (ctx) => {
  await ctx.reply(
    'Пожалуйста, предоставьте идентификаторы пользователей, которых необходимо добавить в систему.',
    {
      reply_parameters: { message_id: ctx.msg.message_id },
    }
  );

  isSet = true;
});

bot.command(['edit_enable_user'], async (ctx) => {
  await ctx.reply(
    'Пожалуйста, укажите идентификаторы пользователей, которых необходимо активировать.',
    {
      reply_parameters: { message_id: ctx.msg.message_id },
    }
  );

  isEnableEdit = true;
  isEdit = true;
});
bot.command(['edit_disabled_user'], async (ctx) => {
  await ctx.reply(
    'Пожалуйста, укажите идентификаторы пользователей, которых необходимо деактивировать.',
    {
      reply_parameters: { message_id: ctx.msg.message_id },
    }
  );

  isEdit = true;
});

bot.command(['delet_user'], async (ctx) => {
  await ctx.reply(
    'Пожалуйста, укажите идентификаторы пользователей, которых необходимо удалить.',
    {
      reply_parameters: { message_id: ctx.msg.message_id },
    }
  );
  isDelete = true;
});

bot.hears(/!!https:\/\/grammy.dev/, async (ctx) => {
  try {
    const users = await getAllUsers();

    const updadaUser = users
      .map((name) => {
        if (name.isActive) return `@${name.name} `;
      })
      .filter((el) => el !== undefined)
      .join('');
    console.log(updadaUser);
    await ctx.api.deleteMessage(ctx.chat.id, ctx.message.message_id);

    const msg = `МР от @${ctx.message.from.username}

${ctx.message.text}

${updadaUser}    
    `;

    await ctx.reply(msg);
  } catch (err) {
    console.error('❌ Не удалось удалить сообщение:', err);
  }
});

bot.on('message', async (ctx) => {
  const msg = ctx.message.text;

  const matches = msg.match(/@\w+/g);

  if (!matches) return;

  const msgUserNames = matches.map((u) => u.slice(1));

  if (isEdit) {
    const { notFindUsersDb, findUsersDb } = await findUsersBd(msgUserNames);

    const activUsersList = findUsersDb
      .filter((el) => (isEnableEdit ? !!el.isActive : !el.isActive))
      .map((el) => `@${el.name}`);

    console.log('activUsersList ==> ', activUsersList);
    // TODO дописать валидацию активных s не активных
    const notActiveUserList = findUsersDb
      .map((el) => {
        console.log('isEnableEdit ==> ', isEnableEdit);
        if (activUsersList.includes(el.name)) {
          return el;
        }
        if (!isEnableEdit) {
          return el;
        }
      })
      .filter((el) => el !== undefined);

    console.log('notActiveUserList ==> ', notActiveUserList);

    if (!!notActiveUserList.length) {
      notActiveUserList.forEach((name) => {
        User.update(
          name.id,
          // isEnableEdit включи или выключи пользователю уведомления
          { name: name.name, isActive: isEnableEdit ? 1 : 0 },
          (err, result) => {
            if (err) console.error(err);
          }
        );
      });
    }

    const messageSuccessNameDb = `✅ Эти пользователи стали  ${
      isEnableEdit ? 'активными' : 'неактивными'
    }: ${notActiveUserList.map((el) => `@${el.name}`).join(', ')}`;

    const messageActiveNameDb = `⚠️ Эти пользователи уже ${
      isEnableEdit ? 'активны' : 'неактивны'
    }: ${activUsersList.join(', ')}`;

    const messageFailureNameDb = `❌ Эти пользователи не существуют в базе: ${notFindUsersDb
      .map((el) => `@${el}`)
      .join(', ')}`;

    await ctx.reply(
      `${!!notActiveUserList.length ? messageSuccessNameDb : ''}\n\n${
        !!activUsersList.length ? messageActiveNameDb : ''
      }\n\n${!!notFindUsersDb.length ? messageFailureNameDb : ''}`,
      {
        reply_parameters: { message_id: ctx.msg.message_id },
      }
    );
  }

  if (isSet) {
    const { notFindUsersDb, namesBd } = await findUsersBd(msgUserNames);

    const newNames = notFindUsersDb;

    newNames.forEach((name) => {
      User.create({ name }, (err, res) => {
        if (err) return;
      });
    });

    const messageSuccessNameDb = ` ✅ Эти пользователи были добавлены в базу: ${newNames
      .map((el) => `@${el}`)
      .join(', ')}`;

    const messageFailureNameDb = `❌ Эти пользователи уже существуют в базе: ${namesBd
      .map((el) => `@${el}`)
      .join(', ')}`;

    await ctx.reply(
      `${!!newNames.length ? messageSuccessNameDb : ''}\n\n${
        !!namesBd.length ? messageFailureNameDb : ''
      }`,
      {
        reply_parameters: { message_id: ctx.msg.message_id },
      }
    );
  }
  if (isDelete) {
    const { notFindUsersDb, findUsersDb, namesBd } = await findUsersBd(
      msgUserNames
    );

    if (!!findUsersDb.length) {
      findUsersDb.forEach((user) => {
        User.delete(user.id, (err, res) => {
          if (err) console.error('Delete bd', err);
        });
      });
    }

    const messageSuccessNameDb = `
       ✅ Эти пользователи были удалены из базы: \n${namesBd
         .map((el) => `@${el}`)
         .join(', ')}`;

    const messageFailureNameDb = `❌ Эти пользователи не существуют в базе: \n${notFindUsersDb
      .map((el) => `@${el}`)
      .join(', ')}`;

    await ctx.reply(
      `${!!namesBd.length ? messageSuccessNameDb : ''}\n\n${
        !!notFindUsersDb.length ? messageFailureNameDb : ''
      }`,
      {
        reply_parameters: { message_id: ctx.msg.message_id },
      }
    );
  }
  isSet = false;
  isDelete = false;
  isEdit = false;
  isEnableEdit = false;
});

// обработка ошибок
bot.catch((err) => {
  const ctx = err.ctx;
  console.error(`Error while handling update ${ctx.update.update_id}`);
  const e = err.error;

  if (e instanceof GrammyError) {
    console.error(`Error in request: ${e.description}`);
  } else if (e instanceof HttpError) {
    console.error(`Could not contact Telegram: ${e}`);
  } else {
    console.error(`Unknow error: ${e}`);
  }
});

bot.start();

// сделать удаления из базы
