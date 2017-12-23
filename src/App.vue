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

    <form class="group-form" action="" @submit.prevent="fetchGroup">
      <div class="wrapper">
        <input type="text" v-model="group_id" required placeholder="ID группы" value="velopohod_s_medvejut">
        <div class="group-form-label">
          Дата от
        </div>
        <datepicker v-model="userStartDate" placeholder="дд.мм" format="dd.MM" minimum-view="day" maximum-view="month" language="ru"></datepicker>
        <div class="group-form-label">
          Дата до
        </div>
        <datepicker v-model="userEndDate" placeholder="дд.мм" format="dd.MM" minimum-view="day" maximum-view="month" language="ru"></datepicker>
        <button type="submit">Найти</button>
      </div>
    </form>

    <div class="main-content" :class="!groupMembers.length ? 'main-content-empty' : ''">
      <div class="wrapper">
        <transition name="fade">
          <div v-if="groupInfo && groupMembers.length" class="group-info">
            <img v-if="groupInfo.photo_50" :src="groupInfo.photo_50" alt="" class="group-info-image">
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

        <table v-if="groupMembers.length" class="group-table">
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
          <tr v-for="(m, index) in groupMembers" v-if="filterMember(m)">
            <td>
              {{ index }}
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
                {{ m.bdate}}
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

  export default {
    name: 'app',
    components: {
      PacmanLoader,
      Datepicker
    },
    data() {
      return {
        params: queryString.parse(window.location.search),
        group_id: null,
        userStartDate: '',
        userEndDate: '',
        stopPlease: false
      }
    },
    computed: {
      token() {
        return this.$store.state.accessToken;
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
      countGroupMembersWithBirthday() {
        return this.$store.getters.countGroupMembersWithBirthday;
      },
      countGroupMembersFiltered() {
        return this.$store.getters.countGroupMembersFiltered;
      },
      spinner() {
        return this.$store.state.spinner;
      }
    },
    methods: {
      vkAuth() {
        let params = {
          redirect_uri: config.redirect_url,
          client_id: config.client_id,
          response_type: 'token',
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
          });
      },
      filterMember(m) {
        if (m.bdate) {
          let bdate = m.bdate.split('.');

          //Check if in date range
          if (
            (moment(this.startDate).month() <= (bdate[1]-1)) &&
            ((bdate[1]-1) <= moment(this.endDate).month())
          ) {
            if (
              (moment(this.startDate).date() <= bdate[0]) &&
              (bdate[0] <= moment(this.endDate).date())
            ) {
              return true;
            }
          }
        }
      }
    },
    mounted() {
      window.moment = moment;
      this.userStartDate = moment(this.startDate).format('dd.MM');
      this.userEndDate = moment(this.endDate).format('dd.MM');

      this.$watch('userStartDate', function (newVal) {
        if (newVal > this.endDate) {
          this.userStartDate = this.endDate;
          newVal = this.endDate;
        }
        this.$store.commit('setStartDate', newVal);
      });

      this.$watch('userEndDate', function (newVal) {
        this.$store.commit('setEndDate', newVal);
      });

      if (this.params.access_token) {
        this.$store.commit('setAccessToken', this.params.access_token);
      }

      /*if (!this.token) {
        this.vkAuth();
      } else {

      }*/
    }
  }
</script>
