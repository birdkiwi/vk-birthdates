<template>
  <div class="donation">
    <table border="0" cellpadding="0" cellspacing="0">
      <tr>
        <td>
          <div
            style="padding: 0.6em; background-color: #DAE6F2; border: 1px solid #B8CFE6; border-radius: 7px; -moz-border-radius: 7px;">
            <a href="https://money.yandex.ru/embed/?from=sbal" title="Виджеты Яндекс.Денег"
               style="width: 200px; height: 100px; display: block; margin-bottom: 0.6em; background: url('https://money.yandex.ru/share-balance.xml?id=29052803&key=2B60CE2C0853DED3') 0 0 no-repeat; -background: none; -filter: progid:DXImageTransform.Microsoft.AlphaImageLoader(src='https://money.yandex.ru/share-balance.xml?id=29052803&key=2B60CE2C0853DED3', sizingMethod = 'crop');"></a>
            <form action="https://money.yandex.ru/direct-payment.xml" method="post"><input type="hidden" name="receiver"
                                                                                           value="41001251279344"/><input
              type="hidden" name="sum" value="100"/><input type="hidden" name="destination"
                                                           value="Яндекс.Деньги &#8212; на хорошее дело не жалко!"/><input
              type="hidden" name="FormComment" value="Пожертвование через виджет 'Мой баланс'"/><input
              type="submit" value="Поддержать проект" style="margin-top: 0.6em; width: 100%;"/></form>
          </div>
        </td>
      </tr>
    </table>
  </div>
</template>
