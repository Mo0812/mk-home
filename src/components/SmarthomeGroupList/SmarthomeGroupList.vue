<template>
    <div class="smarthome-lightbulb-list">
        <div class="filter">
            <div class="columns">
                <div class="column full">
                    <b-input
                        placeholder="Search..."
                        type="search"
                        icon="magnify"
                        v-model="filter.term"
                    ></b-input>
                </div>
            </div>
        </div>
        <b-table
            class="lightbulb-table"
            :items="groups"
            :fields="fields"
            :busy="busy"
            primary-key="id"
            stacked="sm"
            small
            striped
            responsive
        >
            <template v-slot:empty>
                <section class="section">
                    <div class="content has-text-grey has-text-centered">
                        <p>
                            <b-icon icon="emoticon-sad" size="is-large">
                            </b-icon>
                        </p>
                        <p>Nothing here.</p>
                    </div>
                </section>
            </template>
            <template v-slot:cell(isOn)="data">
                <b-button
                    :disabled="data.item.busy"
                    variant="light"
                    @click="toggleGroup(data.item.id)"
                >
                    <b-icon
                        icon="power"
                        :variant="data.item.isOn ? 'success' : 'danger'"
                    />
                </b-button>
            </template>
            <template v-slot:cell(brightness)="data">
                <template v-if="data.item.isDimmable">
                    <b-input
                        class="brightness-switcher"
                        type="range"
                        :value="data.item.brightness"
                        :min="0"
                        :max="100"
                        :disabled="data.item.busy"
                        variant="warning"
                        @change="changeBrightness($event, data.item.id)"
                        lazy
                    /><span class="tag"
                        >{{ data.item.brightness }}%</span
                    ></template
                >
                <template v-else>
                    <span class="tag">Gerät nicht dimmbar</span>
                </template>
            </template>
            <template v-slot:cell(color)="data">
                <template v-if="data.item.color">
                    <ColorMeter :color="data.item.color"
                /></template>
                <template v-else>
                    <span class="tag">Lichtfarbe nicht definiert</span>
                </template>
            </template>
        </b-table>
    </div>
</template>

<script>
import { mapGetters } from "vuex";
import SmarthomeView from "@/mixins/SmarthomeView";
import ColorMeter from "@/components/ColorMeter/ColorMeter";

export default {
    name: "SmarthomeGroupList",
    mixins: [SmarthomeView],
    components: {
        ColorMeter
    },
    data() {
        return {
            fields: [
                {
                    key: "id",
                    label: "ID",
                    sortable: true
                },
                {
                    key: "name",
                    label: "Name",
                    sortable: true
                },
                {
                    key: "isOn",
                    label: "activated",
                    sortable: true,
                    class: "text-center"
                },
                {
                    key: "brightness",
                    label: "Brightness",
                    sortable: false,
                    class: "text-center"
                },
                {
                    key: "color",
                    label: "Color",
                    sortable: false,
                    class: "text-center"
                }
            ],
            filter: {
                term: null
            }
        };
    },
    computed: {
        ...mapGetters({ lightbulbs: "getLightbulbs", rawGroups: "getGroups" }),
        groups() {
            return this.filterData(
                this.processSmarthomeData(
                    JSON.parse(JSON.stringify(this.rawGroups))
                )
            );
        }
    },
    created() {},
    methods: {
        processSmarthomeData(data) {
            return data.map(group => {
                group.groupMember = group.groupMember
                    .map(deviceId => {
                        let devices = this.lightbulbs.filter(
                            item => item.id === deviceId
                        );
                        if (devices.length > 0) {
                            return devices[0];
                        } else {
                            return null;
                        }
                    })
                    .filter(groupMember => groupMember !== null);

                group.isOn =
                    group.groupMember.filter(device => device.isOn).length > 0;
                group.isDimmable =
                    group.groupMember.length > 0 &&
                    group.groupMember.filter(device => device.isDimmable)
                        .length > 0;
                group.brightness =
                    group.groupMember.length > 0
                        ? Math.round(
                              (group.groupMember.reduce(
                                  (acc, currentDevice) =>
                                      acc + currentDevice.brightness.current,
                                  0
                              ) /
                                  group.groupMember.length +
                                  Number.EPSILON) *
                                  100
                          ) / 100
                        : 0;
                group.color =
                    group.groupMember.length > 0
                        ? group.groupMember[0].color
                        : null;
                group.busy =
                    group.groupMember.filter(device => device.busy).length > 0;
                return group;
            });
        },
        toggleGroup(groupId) {
            let group = this.groups.filter(group => group.id === groupId);
            if (group.length > 0) {
                let currentGroup = group[0];
                if (currentGroup.isOn) {
                    this.$store.dispatch("putGroupOff", groupId);
                } else {
                    this.$store.dispatch("putGroupOn", groupId);
                }
            }
        },
        changeBrightness(brightness, groupId) {
            let group = this.groups.filter(group => group.id === groupId);
            if (group.length > 0) {
                this.$store.dispatch("changeGroupBrightness", {
                    id: groupId,
                    brightness: brightness
                });
            }
        },
        filterData(data) {
            if (this.filter.term && this.filter.term !== "") {
                data = data.filter(item =>
                    item.name
                        .toLowerCase()
                        .includes(this.filter.term.toLowerCase())
                );
            }
            return data;
        }
    }
};
</script>
