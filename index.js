require('dotenv').config();

const { Bot, GrammyError, HttpError } = require('grammy');
const { getFindUsers, getAllUsers } = require('./helpers');
const User = require('./db').User;
const bot = new Bot(process.env.BOT_API_KEY);
bot.api.setMyCommands([
  { command: 'set_user', description: 'Записать пользователей в базу' },
  {
    command: 'edit_enable_user',
    description: 'Сдлеать пользователей активными:',
  },
  {
    command: 'edit_disabled_user',
    description: 'Сдлеать пользователей НЕ активными:',
  },
  {
    command: 'delet_user',
    description: 'Удалитть пользватлей из базы:',
  },
]);

let isSet = false;

let isEdit = false;
let isEnableEdit = false;

let isDelete = false;

bot.command(['set_user'], async (ctx) => {
  await ctx.reply('Отправти id пользователей для добавляние:', {
    reply_parameters: { message_id: ctx.msg.message_id },
  });

  isSet = true;
});

bot.command(['edit_enable_user'], async (ctx) => {
  await ctx.reply(
    'Отправьте ID пользователей, которых нужно сделать активными:',
    {
      reply_parameters: { message_id: ctx.msg.message_id },
    }
  );

  isEnableEdit = true;
  isEdit = true;
});
bot.command(['edit_disabled_user'], async (ctx) => {
  await ctx.reply(
    'Отправьте ID пользователей, которых нужно сделать НЕ активными:',
    {
      reply_parameters: { message_id: ctx.msg.message_id },
    }
  );

  isEnableEdit = false;
  isEdit = true;
});

bot.command(['delet_user'], async (ctx) => {
  await ctx.reply('Отправьте ID пользователей, которых нужно удлаить:', {
    reply_parameters: { message_id: ctx.msg.message_id },
  });
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
    console.error('Не удалось удалить сообщение:', err);
  }
});

bot.on('message', async (ctx) => {
  const msg = ctx.message.text;
  // ^@\w+
  const matches = msg.match(/@\w+/g);

  if (!matches) return;

  const msgUserNames = matches.map((u) => u.slice(1));

  if (isEdit) {
    const findUsersBd = [];

    for (const name of msgUserNames) {
      const user = await getFindUsers(name);
      findUsersBd.push(user);
    }

    findUsersBd.forEach((name) => {
      User.update(
        name.id,
        // isEnableEdit включи или выключи пользователю уведомления
        { name: name.name, isActive: isEnableEdit ? 1 : 0 },
        (err, result) => {
          if (err) console.error(err);
        }
      );
    });

    await ctx.reply(
      `Этих пользователй стали ${
        isEnableEdit ? '' : 'НЕ'
      } активными: ${findUsersBd.map((el) => `@${el.name}`).join(', ')}`,
      {
        reply_parameters: { message_id: ctx.msg.message_id },
      }
    );
  }

  if (isSet) {
    const findUsersBd = [];

    for (const name of msgUserNames) {
      const user = await getFindUsers(name);
      findUsersBd.push(user);
    }

    // TODO переписать посик повоторяемых юезеров
    const namesBd = findUsersBd
      .filter((el) => el !== undefined)
      .map((el) => {
        if (!el) {
          return;
        }
        return el.name;
      });

    const newNames = msgUserNames.filter((el) => !namesBd.includes(el));

    newNames.forEach((name) => {
      User.create({ name }, (err, res) => {
        if (err) return;
      });
    });

    await ctx.reply(
      `Этих пользователй добавилив в базу: ${newNames
        .map((el) => `@${el}`)
        .join(', ')}
      
Эти пользватили уже существуют в базе: ${namesBd
        .map((el) => `@${el}`)
        .join(', ')}`,
      {
        reply_parameters: { message_id: ctx.msg.message_id },
      }
    );
  }
  if (isDelete) {
    const findUsersBd = [];

    for (const name of msgUserNames) {
      const user = await getFindUsers(name);
      findUsersBd.push(user);
    }

    // TODO переписать посик повоторяемых юезеров
    const namesBd = findUsersBd
      .filter((el) => el !== undefined)
      .map((el) => {
        if (!el) {
          return;
        }
        return el.name;
      });

    const notNamesBd = msgUserNames.filter((el) => !namesBd.includes(el));

    findUsersBd.forEach((user) => {
      User.delete(user.id, (err, res) => {
        if (err) console.error('Delete bd', err);
      });
    });

    await ctx.reply(
      `Эти пользователи удалены из базы: ${namesBd
        .map((el) => `@${el}`)
        .join(', ')}
        
Эти пользватили не существуют в базе: ${notNamesBd
        .map((el) => `@${el}`)
        .join(', ')}`,
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
