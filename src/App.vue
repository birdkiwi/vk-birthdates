<template>
  <div class="app" id="app">
    <transition name="fade">
      <div v-if="spinner" class="spinner-overlay">
        <pacman-loader></pacman-loader>
        <div class="spinner-info">
          {{ groupMembers.length }} / <span v-if="groupInfo.members_count">{{ groupInfo.members_count }}</span>
          <br>
          <button class="stop-please" v-if="!stopPlease" @click.prevent="stopPlease = true">Стоп</button>
        </div>
      </div>
    </transition>

    <form class="group-form" action="" @submit.prevent="token ? fetchGroup() : vkAuth()">
      <div class="wrapper">
        <a href="https://startler.ru" class="logo">
          Startler
        </a>
        <input type="text" v-model="group_id" required placeholder="ID группы" value="velopohod_s_medvejut">
        <div class="group-form-label">
          Дата от
        </div>
        <datepicker v-model="userStartDate" placeholder="дд.мм" format="dd.MM" minimum-view="day" maximum-view="month" language="ru" :monday-first="true"></datepicker>
        <div class="group-form-label">
          Дата до
        </div>
        <datepicker v-model="userEndDate" placeholder="дд.мм" format="dd.MM" minimum-view="day" maximum-view="month" language="ru" :monday-first="true"></datepicker>
        <button type="submit">Найти</button>

        <a v-if="!token" href="#" @click.prevent="vkAuth" class="group-form-user group-form-user-empty" title="Авторизоваться в VK">
          ?
        </a>
        <div class="group-form-user" :title="userPersonal.first_name + ' ' + userPersonal.last_name" v-else>
          <img v-if="userPersonal.photo_50" :src="userPersonal.photo_50" alt="">
        </div>
      </div>
    </form>

    <div class="main-content" :class="!groupMembers.length ? 'main-content-empty' : ''">
      <div class="wrapper">
        <transition name="fade">
          <div v-if="groupInfo && groupMembers.length" class="group-info">
            <div class="group-info-image" v-if="groupInfo.photo_50">
              <img :src="groupInfo.photo_50" alt="">
            </div>
            <h1 class="group-info-name">{{ groupInfo.name }}</h1>
          </div>
        </transition>

        <transition name="fade">
          <div v-if="groupMembers.length" class="group-stats">
            Всего найдено участников: {{ groupMembers.length }} <br>
            С заполненой датой рождения: {{ countGroupMembersWithBirthday }} <br>
            Отфильтровано по датам: {{ countGroupMembersFiltered }}
          </div>
        </transition>

        <transition name="fade">
          <div v-if="groupMembers.length" class="row">
            <div class="col-xs-12 col-sm-6">
              <div class="text-template-area" v-html="textTemplate"></div>
            </div>
            <div class="col-xs-12 col-sm-6">
              <div class="text-template-area" v-html="altTextTemplate"></div>
            </div>
          </div>
        </transition>

        <div class="csv-button" v-if="filteredGroupMembers.length">
          <button @click.prevent="downloadCSV">Скачать CSV</button>
        </div>

        <table v-if="filteredGroupMembers.length" class="group-table">
          <tbody>
          <tr>
            <th>
              #
            </th>
            <th>
              ID
            </th>
            <th>
              Имя
            </th>
            <th>
              Фамилия
            </th>
            <th>
              День рождения
            </th>
          </tr>
          <tr v-for="(m, index) in filteredGroupMembers">
            <td>
              {{ index+1 }}
            </td>
            <td>
              <a :href="'https://vk.com/id' + m.id" target="_blank">
                {{ m.id }}
              </a>
            </td>
            <td>
              {{ m.first_name }}
            </td>
            <td>
              {{ m.last_name }}
            </td>
            <td>
              <span v-if="m.bdate">
                {{ formatBdate(m.bdate) }}
              </span>
              <span v-else>
                —
              </span>
            </td>
          </tr>
          </tbody>
        </table>

        <div v-if="!groupMembers.length">
          <div class="group-empty">
            <img src="./assets/cake.svg" alt="The Cake Is a Lie">
            <h1 class="group-empty-title">
              Дни рождения в группе VK (Вконтакте)
            </h1>
            <p>
              <span class="group-empty-icon">🎁</span>
                Введите ID группы и поздравьте всех своих пользователей!
              <span class="group-empty-icon">🎈</span>
            </p>
          </div>
        </div>

        <donation></donation>
        <disqus></disqus>
      </div>
    </div>
  </div>
</template>

<script>
  import config from './config';
  import styles from './assets/scss/style.scss';
  import Datepicker from 'vuejs-datepicker';
  import queryString from 'query-string';
  import moment from 'moment';
  import PacmanLoader from 'vue-spinner/src/PacmanLoader';
  import Donation from './components/donation';
  import Disqus from './components/disqus';

  export default {
    name: 'app',
    components: {
      PacmanLoader,
      Datepicker,
      Donation,
      Disqus
    },
    data() {
      return {
        params: queryString.parse(window.location.hash),
        group_id: null,
        userStartDate: '',
        userEndDate: '',
        stopPlease: false
      }
    },
    computed: {
      token() {
        return this.$store.state.userInfo.access_token;
      },
      userId() {
        return this.$store.state.userInfo.user_id;
      },
      userPersonal() {
        return this.$store.state.userInfo.personal;
      },
      startDate() {
        return this.$store.state.startDate;
      },
      endDate() {
        return this.$store.state.endDate;
      },
      groupInfo() {
        return this.$store.state.groupInfo;
      },
      groupMembers() {
        return this.$store.state.groupMembers;
      },
      filteredGroupMembers() {
        return this.$store.getters.filteredGroupMembers;
      },
      countGroupMembersWithBirthday() {
        return this.$store.getters.countGroupMembersWithBirthday;
      },
      countGroupMembersFiltered() {
        return this.$store.getters.countGroupMembersFiltered;
      },
      spinner() {
        return this.$store.state.spinner;
      },
      textTemplate() {
        let text = 'Поздравляем наших именинников этой недели! ';

        if (this.filteredGroupMembers.length) {
          this.filteredGroupMembers.forEach(m => {
            text += ` <a href="https://vk.com/${m.id}">@id${m.id}</a>,`;
          });
          // Remove last comma
          text = text.slice(0, -1);
        }
        return text;
      },
      altTextTemplate() {
        let text = '';

        if (this.filteredGroupMembers.length) {
          this.filteredGroupMembers.forEach(m => {
              text += ` <a href="https://vk.com/${m.id}">@id${m.id}</a> (${m.first_name} ${m.last_name}),`;
          });
          // Remove last comma
          text = text.slice(0, -1);
        }
        return text;
      }
    },
    methods: {
      vkAuth() {
        let params = {
          redirect_uri: config.login_url,
          display: 'page',
          client_id: config.client_id,
          response_type: 'code',
          v: config.api_ver
        };

        window.location.href = 'https://oauth.vk.com/authorize?' + queryString.stringify(params);
      },
      fetchGroup() {
        this.$store.commit('setSpinner', true);
        this.$store.commit('clearGroupMembers');

        this.$store.dispatch('fetchGroupInfo', this.group_id)
          .then(res => {
            if (res.data && res.data.response && res.data.response.length) {
              this.$store.commit('setGroupInfo', res.data.response[0]);

              const membersCount = res.data.response[0].members_count;
              console.log("Members count: " + membersCount);

              let requestsNum = Math.ceil(membersCount / 1000);
              let requestsCounter = 0;

              let _this = this;

              function fetch() {
                console.log(requestsCounter * 1000);

                _this.$store.dispatch('fetchGroupMembers', {
                  group_id: _this.group_id,
                  offset: requestsCounter * 1000
                })
                  .then(res => {
                    if (res.data && res.data.response && res.data.response.items) {
                      _this.$store.commit('concatGroupMembers', res.data.response.items);
                    }
                    console.log(res.data);

                    if ((requestsCounter + 1) < requestsNum && !_this.stopPlease) {
                      requestsCounter++;
                      fetch();
                    } else {
                      _this.$store.commit('setSpinner', false);
                      _this.stopPlease = false;
                    }

                    if (res.data && res.data.error && res.data.error.error_msg) {
                      _this.$toaster.error(res.data.error.error_msg);
                    }
                  })
                  .catch(err => {
                    _this.$toaster.error("Network error...");
                    _this.$store.commit('setSpinner', false);
                    _this.stopPlease = false;
                  });
              }

              fetch();
            }

            if (res.data && res.data.error && res.data.error.error_msg) {
              this.$toaster.error(err.data.error.error_msg);
            }
          })
          .catch(err => {
            this.$toaster.error("Network error...");
            this.$store.commit('setSpinner', false);
            this.stopPlease = false;
          });
      },
      downloadCSV() {
        this.$store.dispatch('getFilteredGroupMembersCSV')
          .then(res => {
            const data = 'data:text/plain;charset=utf-8,' + encodeURIComponent(res);

            const link = document.createElement('a');
            link.setAttribute('href', data);
            link.setAttribute('download', 'export.csv');
            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          })
          .catch(e => {
            console.log(e);
            this.$toaster.error("Ошибка выгрузки CSV");
          });
      },
      formatBdate(bdate) {
        let date = bdate.split('.');
        date[0] = date[0].padStart(2, '0');
        date[1] = date[1].padStart(2, '0');
        return date[0] + '.' + date[1];
      },
      updateLocationHash() {
        this.params.startDate = moment(this.$store.state.startDate).format('YYYY-MM-DD');
        this.params.endDate = moment(this.$store.state.endDate).format('YYYY-MM-DD');
        this.params.group_id = this.group_id;
        window.location.hash = queryString.stringify(this.params);
      }
    },
    mounted() {
      if (this.params.access_token) {
        this.$store.commit('setAccessToken', this.params.access_token);
      }

      if (this.params.user_id) {
        this.$store.commit('setUserId', this.params.user_id);
      }

      window.moment = moment;

      if (this.token && this.userId) {
        this.$store.dispatch('fetchUserInfo')
          .then(res => {
            if (res.data && res.data.error && res.data.error.error_msg) {
              this.$toaster.error(res.data.error.error_msg);
              this.$store.commit('setAccessToken', null);
              this.$store.commit('setUserId', null);
              this.$store.commit('setUserPersonal', {});
            }

            if (res.data && res.data.response && res.data.response.length) {
              this.$store.commit('setUserPersonal', res.data.response[0]);
            }
          }).catch(e => {
            console.log(e);
            _this.$toaster.error("Ошибка авторизации в VK. Network error...");
          });
      }

      this.userStartDate = this.params.startDate ? moment(this.params.startDate).toDate() : this.startDate;
      this.userEndDate = this.params.endDate ? moment(this.params.endDate).toDate() : this.endDate;
      this.group_id = this.params.group_id;

      this.$watch('userStartDate', newVal => {
        this.$store.commit('setStartDate', newVal);
        this.updateLocationHash();
      });

      this.$watch('userEndDate', newVal => {
        this.$store.commit('setEndDate', newVal);
        this.updateLocationHash();
      });

      this.$watch('group_id', () => {
        this.updateLocationHash();
      });
    }
  }
</script>
